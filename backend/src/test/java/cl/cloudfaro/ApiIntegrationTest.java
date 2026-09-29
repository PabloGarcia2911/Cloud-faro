package cl.cloudfaro;
import cl.cloudfaro.repository.*;
import cl.cloudfaro.config.SecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.test.web.servlet.MockMvc;
import java.time.Instant;
import java.util.List;
import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@SpringBootTest(properties={"spring.datasource.url=jdbc:sqlite:target/test-productos.db","spring.jpa.hibernate.ddl-auto=create-drop"})
@AutoConfigureMockMvc
class ApiIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ProductRepository products;
    @Autowired ContactMessageRepository contacts;
    @Autowired ObjectMapper mapper;
    @MockitoBean JwtDecoder decoder;
    static final String BODY="{\"name\":\"Cuaderno\",\"description\":\"Académico\",\"price\":1990.50,\"stock\":4}";
    @BeforeEach void setup() { products.deleteAll(); contacts.deleteAll(); }
    Jwt token(String role) {
        return Jwt.withTokenValue("test-token").header("alg","RS256").subject("test-student")
            .issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(300))
            .claim("cognito:groups",List.of(role)).claim("client_id","test-client").claim("token_use","access").build();
    }
    void role(String role) { when(decoder.decode("test-token")).thenReturn(token(role)); }
    @Test void anonymousAndInvalidTokens() throws Exception {
        mvc.perform(get("/api/public/info")).andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Cloud-faro"));
        mvc.perform(get("/api/products")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/contact").contentType("application/json").content("{}" )).andExpect(status().isUnauthorized());
        when(decoder.decode("bad")).thenThrow(new BadJwtException("bad token"));
        mvc.perform(get("/api/products").header("Authorization","Bearer bad")).andExpect(status().isUnauthorized());
    }
    @ParameterizedTest @ValueSource(strings={"ADMIN","EDITOR","USER"})
    void allRolesReadAndSendContact(String value) throws Exception {
        role(value);
        mvc.perform(get("/api/products").header("Authorization","Bearer test-token")).andExpect(status().isOk());
        mvc.perform(post("/api/contact").header("Authorization","Bearer test-token").contentType("application/json")
            .content("{\"subject\":\"Consulta\",\"message\":\"Hola\"}"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.senderId").value("test-student"));
        mvc.perform(get("/api/contact").header("Authorization","Bearer test-token"))
            .andExpect(status().is(value.equals("USER")?403:200));
        assertThat(contacts.findAll()).hasSize(1);
    }
    @ParameterizedTest @ValueSource(strings={"EDITOR","USER"})
    void nonAdminCannotMutate(String value) throws Exception {
        role(value);
        mvc.perform(post("/api/products").header("Authorization","Bearer test-token").contentType("application/json").content(BODY)).andExpect(status().isForbidden());
        mvc.perform(put("/api/products/1").header("Authorization","Bearer test-token").contentType("application/json").content(BODY)).andExpect(status().isForbidden());
        mvc.perform(delete("/api/products/1").header("Authorization","Bearer test-token")).andExpect(status().isForbidden());
    }
    @Test void adminCrudPersistsAndMissingReturns404() throws Exception {
        role("ADMIN");
        var response=mvc.perform(post("/api/products").header("Authorization","Bearer test-token").contentType("application/json").content(BODY))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long id=mapper.readTree(response).get("id").asLong();
        assertThat(products.findById(id).orElseThrow().getName()).isEqualTo("Cuaderno");
        mvc.perform(put("/api/products/"+id).header("Authorization","Bearer test-token").contentType("application/json").content(BODY.replace("Cuaderno","Libro")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Libro"));
        assertThat(products.findById(id).orElseThrow().getName()).isEqualTo("Libro");
        mvc.perform(delete("/api/products/"+id).header("Authorization","Bearer test-token")).andExpect(status().isNoContent());
        assertThat(products.findById(id)).isEmpty();
        mvc.perform(delete("/api/products/"+id).header("Authorization","Bearer test-token")).andExpect(status().isNotFound());
        mvc.perform(put("/api/products/"+id).header("Authorization","Bearer test-token").contentType("application/json").content(BODY)).andExpect(status().isNotFound());
    }
    @Test void validationAndUnknownRole() throws Exception {
        role("ADMIN");
        mvc.perform(post("/api/products").header("Authorization","Bearer test-token").contentType("application/json").content(BODY.replace("1990.50","-1"))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/contact").header("Authorization","Bearer test-token").contentType("application/json").content("{}" )).andExpect(status().isBadRequest());
        role("OTHER");
        mvc.perform(get("/api/products").header("Authorization","Bearer test-token")).andExpect(status().isForbidden());
    }
    @Test void corsAllowsOnlyLocalFrontend() throws Exception {
        mvc.perform(options("/api/products").header("Origin","http://localhost:3000").header("Access-Control-Request-Method","POST").header("Access-Control-Request-Headers","authorization,content-type"))
            .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin","http://localhost:3000"));
        mvc.perform(options("/api/products").header("Origin","https://invalid.example").header("Access-Control-Request-Method","POST")).andExpect(status().isForbidden());
    }
    @Test void converterAndClientValidation() {
        var config=new SecurityConfig();
        assertThat(config.jwtAuthenticationConverter().convert(token("ADMIN")).getAuthorities()).extracting("authority").containsExactly("ROLE_ADMIN");
        assertThat(SecurityConfig.cognitoAccessTokenValidator("test-client").validate(token("ADMIN")).hasErrors()).isFalse();
        assertThat(SecurityConfig.cognitoAccessTokenValidator("other-client").validate(token("ADMIN")).hasErrors()).isTrue();
        var idToken=Jwt.withTokenValue("id").header("alg","RS256").subject("student").claim("client_id","test-client").claim("token_use","id").build();
        assertThat(SecurityConfig.cognitoAccessTokenValidator("test-client").validate(idToken).hasErrors()).isTrue();
    }
}
