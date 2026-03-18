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
import { StreamTokenController } from "../routes/stream-token.controller.js";
import { RealtimeTokenService } from "../routes/realtime-token.service.js";
import { PublicApiController } from "../routes/public-api.controller.js";
import { PublicContactController } from "../routes/public-contact.controller.js";
import { TimeEntriesController } from "../routes/time-entries.controller.js";
import { ConversationManagementController } from "../routes/conversation-management.controller.js";
import { BlockersController } from "../routes/blockers.controller.js";
import { RecurringTasksController } from "../routes/recurring-tasks.controller.js";
import { StaffController } from "../routes/staff.controller.js";
import { ProfileController } from "../routes/profile.controller.js";
import { BrandController } from "../routes/brand.controller.js";
import { FeedbackController } from "../routes/feedback.controller.js";
import { ContractsController } from "../routes/contracts.controller.js";
import { AdminController } from "../routes/admin.controller.js";
import { SearchController } from "../routes/search.controller.js";
import { DocumentsController } from "../routes/documents.controller.js";
import { ServiceCatalogController } from "../routes/service-catalog.controller.js";
import { AutomationController } from "../routes/automation.controller.js";
import { GoogleCalendarController } from "../routes/google-calendar.controller.js";
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
    StreamTokenController,
    TimeEntriesController,
    ConversationManagementController,
    BlockersController,
    RecurringTasksController,
    StaffController,
    ProfileController,
    BrandController,
    FeedbackController,
    ContractsController,
    AdminController,
    SearchController,
    DocumentsController,
    PublicApiController,
    PublicContactController,
    ServiceCatalogController,
    AutomationController,
    GoogleCalendarController,
    MetricsController
  ],
  providers: [
    RealtimeEventsService,
    RealtimeTokenService,
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
