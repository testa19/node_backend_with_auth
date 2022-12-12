import { Prisma } from "@prisma/client";
import { JobsOptions, Queue, QueueEvents, Worker } from "bullmq";
import IORedis from "ioredis";
import { redisUrl } from "./connectRedis";
import { sendPasswordResetToken, sendVerificationCode } from "./mailer";

// Settings

const QueuePrefix = "bull";
const MAIL_QUEUE = "mail";

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Queues

const mailQueue = new Queue(MAIL_QUEUE, {
  connection,
  prefix: QueuePrefix,
});

const mailQueueJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 1000,
  },
  removeOnComplete: 10,
  removeOnFail: 10,
};

// Producers

const RESET_PASSWORD_JOB = "reset_password";
const VERIFY_EMAIL = "verify_email";

export const sendPasswordResetTokenJob = (
  user: Prisma.UserCreateInput,
  url: string
) => {
  mailQueue.add(RESET_PASSWORD_JOB, { user, url }, mailQueueJobOptions);
};

export const sendVerificationCodeJob = (
  user: Prisma.UserCreateInput,
  url: string
) => {
  mailQueue.add(VERIFY_EMAIL, { user, url }, mailQueueJobOptions);
};

// Workers

const worker = new Worker(
  MAIL_QUEUE,
  async (job) => {
    if (job.name === RESET_PASSWORD_JOB) {
      await sendPasswordResetToken(job.data.user, { url: job.data.url });
    }
    if (job.name === VERIFY_EMAIL) {
      await sendVerificationCode(job.data.user, { url: job.data.url });
    }
  },
  { connection }
);

// Job listeners (for failed retried jobs will be every time)

worker.on("completed", (job) => {
  console.log(`🟢 ${job.id} has completed!`);
});

worker.on("failed", (job, err) => {
  console.log(`${new Date()} ${job!.id} has failed with ${err.message}`);
});

// Global listeners (for failed retried jobs will be called once)

// const queueEvents = new QueueEvents(MAIL_QUEUE, { connection });

// queueEvents.on("completed", ({ jobId }) => {
//   console.log(`(global) ${jobId} succeeded!`);
// });

// queueEvents.on(
//   "failed",
//   ({ jobId, failedReason }: { jobId: string; failedReason: string }) => {
//     console.error(`🔴 (global) error for ${jobId}`, failedReason);
//   }
// );
