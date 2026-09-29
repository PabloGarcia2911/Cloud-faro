package cl.cloudfaro.entity;
import jakarta.persistence.*;
import java.time.Instant;
@Entity
@Table(name="contact_messages")
public class ContactMessage {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private String subject;
    @Column(nullable=false, length=4000) private String message;
    @Column(nullable=false) private String senderId;
    @Column(nullable=false) private Instant createdAt;
    protected ContactMessage() {}
    public ContactMessage(String subject, String message, String senderId) {
        this.subject=subject; this.message=message; this.senderId=senderId; this.createdAt=Instant.now();
    }
    public Long getId() { return id; }
    public String getSubject() { return subject; }
    public String getMessage() { return message; }
    public String getSenderId() { return senderId; }
    public Instant getCreatedAt() { return createdAt; }
}
