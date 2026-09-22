-- 360 feedback is released. Flip the operator release switch on so fresh and
-- rehearsed environments match production, where it is already enabled.
-- The require_360_release() guards remain in place; this simply opens the gate.
UPDATE private.feedback_360_release SET enabled = true WHERE singleton;
