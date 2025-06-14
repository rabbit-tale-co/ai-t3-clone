CREATE TABLE IF NOT EXISTS "UserApiKey" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"provider" varchar NOT NULL,
	"keyName" varchar(100) NOT NULL,
	"encryptedKey" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastUsedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "fullName" varchar(100);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "avatarUrl" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "subscriptionId" varchar(255);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "subscriptionStatus" varchar;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "subscriptionCurrentPeriodEnd" timestamp;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "subscriptionCurrentPeriodStart" timestamp;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "customerId" varchar(255);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserApiKey" ADD CONSTRAINT "UserApiKey_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
