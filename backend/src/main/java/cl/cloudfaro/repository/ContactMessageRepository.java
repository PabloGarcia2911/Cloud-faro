package cl.cloudfaro.repository;
import cl.cloudfaro.entity.ContactMessage;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ContactMessageRepository extends JpaRepository<ContactMessage,Long> {}
