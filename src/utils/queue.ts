import { Prisma } from "@prisma/client";
import Queue from "bull";
import { sendPasswordResetToken, sendVerificationCode } from "./mailer";

export const QueuePrefix = "bull";

const mailQueue = new Queue("mail", { prefix: QueuePrefix });

const mailQueueJobOptions: Queue.JobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 2000,
  },
  removeOnComplete: 10,
  removeOnFail: 10,
};

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

mailQueue.process("reset_password", (job, done) => {
  sendPasswordResetToken(job.data.user, { url: job.data.url });
  done();
});

// mailQueue.on("global:completed", (jobId) => {
//   console.log(`${jobId} succeeded!`);
// });

// mailQueue.on("global:active", (jobId) => {
//   console.log(`${jobId} active!`);
// });

mailQueue.process("verify_email", (job, done) => {
  sendVerificationCode(job.data.user, { url: job.data.url });
  done();
});
