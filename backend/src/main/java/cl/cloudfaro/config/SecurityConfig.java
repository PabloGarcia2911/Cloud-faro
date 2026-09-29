package cl.cloudfaro.config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.*;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.*;
import java.util.List;
@Configuration
public class SecurityConfig {
    @Bean public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http.cors(c -> {}).csrf(c -> c.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers(HttpMethod.OPTIONS,"/**").permitAll()
                .requestMatchers(HttpMethod.GET,"/api/public/info").permitAll()
                .requestMatchers(HttpMethod.GET,"/api/products").hasAnyRole("ADMIN","EDITOR","USER")
                .requestMatchers(HttpMethod.POST,"/api/products").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,"/api/products/*").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE,"/api/products/*").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST,"/api/contact").hasAnyRole("ADMIN","EDITOR","USER")
                .requestMatchers(HttpMethod.GET,"/api/contact").hasAnyRole("ADMIN","EDITOR")
                .anyRequest().denyAll())
            .oauth2ResourceServer(o -> o.jwt(j -> j.jwtAuthenticationConverter(jwtAuthenticationConverter())))
            .build();
    }
    @Bean public JwtAuthenticationConverter jwtAuthenticationConverter() {
        var authorities=new JwtGrantedAuthoritiesConverter();
        authorities.setAuthoritiesClaimName("cognito:groups"); authorities.setAuthorityPrefix("ROLE_");
        var converter=new JwtAuthenticationConverter(); converter.setJwtGrantedAuthoritiesConverter(authorities); return converter;
    }
    @Bean public JwtDecoder jwtDecoder(
            @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}") String issuer,
            @Value("${cloudfaro.cognito.client-id}") String clientId) {
        var decoder=NimbusJwtDecoder.withJwkSetUri(issuer+"/.well-known/jwks.json").build();
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
            JwtValidators.createDefaultWithIssuer(issuer), cognitoAccessTokenValidator(clientId)));
        return decoder;
    }
    public static OAuth2TokenValidator<Jwt> cognitoAccessTokenValidator(String clientId) {
        return jwt -> "access".equals(jwt.getClaimAsString("token_use")) && clientId.equals(jwt.getClaimAsString("client_id"))
            ? OAuth2TokenValidatorResult.success()
            : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token","Se requiere access token del App Client configurado",null));
    }
    @Bean public CorsConfigurationSource corsConfigurationSource() {
        var config=new CorsConfiguration(); config.setAllowedOrigins(List.of("http://localhost:3000"));
        config.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization","Content-Type"));
        var source=new UrlBasedCorsConfigurationSource(); source.registerCorsConfiguration("/**",config); return source;
    }
}
