package cl.cloudfaro.dto;
import jakarta.validation.constraints.*;
public record ContactRequest(@NotBlank @Size(max=150) String subject,
                             @NotBlank @Size(max=4000) String message) {}
