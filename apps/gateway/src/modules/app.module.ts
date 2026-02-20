import { Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { HealthController } from "../routes/health.controller.js";
import { AuthController } from "../routes/auth.controller.js";
import { ClientsController } from "../routes/clients.controller.js";
import { ProjectsController } from "../routes/projects.controller.js";
import { BookingsController } from "../routes/bookings.controller.js";
import { ProposalsController } from "../routes/proposals.controller.js";
import { OnboardingController } from "../routes/onboarding.controller.js";
import { OperationsController } from "../routes/operations.controller.js";
import { LeadsController } from "../routes/leads.controller.js";
import { ChatController } from "../routes/chat.controller.js";
import { FilesController } from "../routes/files.controller.js";
import { BillingController } from "../routes/billing.controller.js";
import { AiController } from "../routes/ai.controller.js";
import { AnalyticsController } from "../routes/analytics.controller.js";
import { NotificationsController } from "../routes/notifications.controller.js";
import { RealtimeController } from "../routes/realtime.controller.js";
import { RealtimeEventsService } from "../routes/realtime-events.service.js";
import { PublicApiController } from "../routes/public-api.controller.js";
import { PublicContactController } from "../routes/public-contact.controller.js";
import { TimeEntriesController } from "../routes/time-entries.controller.js";
import { ConversationManagementController } from "../routes/conversation-management.controller.js";
import { BlockersController } from "../routes/blockers.controller.js";
import { RbacGuard } from "../auth/rbac.guard.js";
import { RequestIdInterceptor } from "../common/request-id.interceptor.js";
import { MetricsController } from "../observability/metrics.controller.js";
import { MetricsInterceptor } from "../observability/metrics.interceptor.js";
import { MetricsService } from "../observability/metrics.service.js";
import { RateLimitGuard } from "../security/rate-limit.guard.js";

@Module({
  controllers: [
    HealthController,
    AuthController,
    ClientsController,
    ProjectsController,
    BookingsController,
    ProposalsController,
    OnboardingController,
    OperationsController,
    LeadsController,
    ChatController,
    FilesController,
    BillingController,
    AiController,
    AnalyticsController,
    NotificationsController,
    RealtimeController,
    TimeEntriesController,
    ConversationManagementController,
    BlockersController,
    PublicApiController,
    PublicContactController,
    MetricsController
  ],
  providers: [
    RealtimeEventsService,
    MetricsService,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard
    },
    {
      provide: APP_GUARD,
      useClass: RbacGuard
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestIdInterceptor
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor
    }
  ]
})
export class AppModule {}
