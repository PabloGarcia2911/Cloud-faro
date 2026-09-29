package cl.cloudfaro.entity;
import jakarta.persistence.*;
import java.math.BigDecimal;
@Entity
@Table(name="products")
public class Product {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private String name;
    @Column(nullable=false) private String description;
    @Column(nullable=false) private BigDecimal price;
    @Column(nullable=false) private Integer stock;
    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String value) { name=value; }
    public String getDescription() { return description; }
    public void setDescription(String value) { description=value; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal value) { price=value; }
    public Integer getStock() { return stock; }
    public void setStock(Integer value) { stock=value; }
}
