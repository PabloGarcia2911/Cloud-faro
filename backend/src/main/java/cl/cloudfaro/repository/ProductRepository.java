package cl.cloudfaro.repository;
import cl.cloudfaro.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ProductRepository extends JpaRepository<Product,Long> {}
