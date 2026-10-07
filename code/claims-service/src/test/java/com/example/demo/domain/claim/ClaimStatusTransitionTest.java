package com.example.demo.domain.claim;

import com.example.demo.domain.claim.events.ClaimStatusChanged;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ClaimStatusTransitionTest {

    @Test
    void submittedClaimCanMoveToUnderReviewAndRecordsStatusChange() {
        // Arrange
        Claim claim = createSubmittedClaim();
        claim.clearEvents();

        // Act
        claim.updateStatus(ClaimStatus.UNDER_REVIEW);

        // Assert
        assertEquals(ClaimStatus.UNDER_REVIEW, claim.getStatus());
        assertEquals(1, claim.getDomainEvents().size());

        ClaimStatusChanged event = assertInstanceOf(
                ClaimStatusChanged.class,
                claim.getDomainEvents().getFirst()
        );
        assertEquals(claim.getClaimId(), event.claimId());
        assertEquals(ClaimStatus.SUBMITTED, event.oldStatus());
        assertEquals(ClaimStatus.UNDER_REVIEW, event.newStatus());
    }

    @Test
    void submittedClaimCannotMoveDirectlyToApprovedAndRemainsUnchanged() {
        // Arrange
        Claim claim = createSubmittedClaim();
        claim.clearEvents();
        Instant updatedAtBeforeAttempt = claim.getUpdatedAt();

        // Act
        InvalidStatusTransitionException exception = assertThrows(
                InvalidStatusTransitionException.class,
                () -> claim.updateStatus(ClaimStatus.APPROVED)
        );

        // Assert
        assertEquals("Cannot transition from SUBMITTED to APPROVED", exception.getMessage());
        assertEquals(ClaimStatus.SUBMITTED, claim.getStatus());
        assertEquals(updatedAtBeforeAttempt, claim.getUpdatedAt());
        assertTrue(claim.getDomainEvents().isEmpty());
    }

    private Claim createSubmittedClaim() {
        return new Claim(
                UUID.randomUUID(),
                UUID.randomUUID(),
                LocalDate.now().minusDays(1),
                "Kuala Lumpur city centre",
                "Vehicle damaged in a road traffic incident",
                new BigDecimal("2500.00")
        );
    }
}
