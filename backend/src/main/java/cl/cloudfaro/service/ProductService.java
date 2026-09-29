package cl.cloudfaro.service;
import cl.cloudfaro.entity.Product;
import cl.cloudfaro.dto.ProductRequest;
import cl.cloudfaro.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.List;
@Service
@Transactional
public class ProductService {
    private final ProductRepository repository;
    public ProductService(ProductRepository repository) { this.repository=repository; }
    @Transactional(readOnly=true)
    public List<Product> list() { return repository.findAll(); }
    public Product create(ProductRequest request) { return repository.save(assign(new Product(), request)); }
    public Product update(Long id, ProductRequest request) { return repository.save(assign(find(id), request)); }
    public void delete(Long id) { repository.delete(find(id)); }
    private Product find(Long id) { return repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"Producto no encontrado")); }
    private Product assign(Product product, ProductRequest request) {
        product.setName(request.name().trim()); product.setDescription(request.description().trim());
        product.setPrice(request.price()); product.setStock(request.stock()); return product;
    }
}
