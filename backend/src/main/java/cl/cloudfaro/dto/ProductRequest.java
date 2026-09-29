package cl.cloudfaro.dto;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
public record ProductRequest(
    @NotBlank @Size(max=120) String name,
    @NotNull @Size(max=1000) String description,
    @NotNull @DecimalMin("0.00") @Digits(integer=9,fraction=2) BigDecimal price,
    @NotNull @Min(0) @Max(1000000) Integer stock) {}
