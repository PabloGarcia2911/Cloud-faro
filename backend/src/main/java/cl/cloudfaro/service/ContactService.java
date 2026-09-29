package cl.cloudfaro.service;
import cl.cloudfaro.entity.ContactMessage;
import cl.cloudfaro.dto.ContactRequest;
import cl.cloudfaro.repository.ContactMessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
@Service
@Transactional
public class ContactService {
    private final ContactMessageRepository repository;
    public ContactService(ContactMessageRepository repository) { this.repository=repository; }
    public ContactMessage create(ContactRequest request, String senderId) {
        return repository.save(new ContactMessage(request.subject().trim(), request.message().trim(), senderId));
    }
    @Transactional(readOnly=true)
    public List<ContactMessage> list() { return repository.findAll(); }
}
