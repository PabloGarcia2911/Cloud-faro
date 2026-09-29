package cl.cloudfaro.controller;
import cl.cloudfaro.service.ContactService;
import cl.cloudfaro.entity.ContactMessage;
import cl.cloudfaro.dto.ContactRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.util.List;
@RestController @RequestMapping("/api/contact")
public class ContactController {
    private final ContactService service;
    public ContactController(ContactService service) { this.service=service; }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public ContactMessage create(@Valid @RequestBody ContactRequest request, @AuthenticationPrincipal Jwt jwt) { return service.create(request,jwt.getSubject()); }
    @GetMapping public List<ContactMessage> list() { return service.list(); }
}
