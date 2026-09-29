package cl.cloudfaro.controller;
import cl.cloudfaro.service.ProductService;
import cl.cloudfaro.entity.Product;
import cl.cloudfaro.dto.ProductRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import java.util.List;
@RestController @RequestMapping("/api/products")
public class ProductController {
    private final ProductService service;
    public ProductController(ProductService service) { this.service=service; }
    @GetMapping public List<Product> list() { return service.list(); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public Product create(@Valid @RequestBody ProductRequest request) { return service.create(request); }
    @PutMapping("/{id}") public Product update(@PathVariable Long id, @Valid @RequestBody ProductRequest request) { return service.update(id,request); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { service.delete(id); }
}
