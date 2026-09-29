package cl.cloudfaro.controller;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController @RequestMapping("/api/public")
public class PublicController {
    @GetMapping("/info") public Map<String,String> info() {
        return Map.of("name","Cloud-faro", "description","Catálogo académico con Spring Boot, SQLite y Cognito", "version","1.0.0");
    }
}
