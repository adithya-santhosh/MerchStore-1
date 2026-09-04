import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/lib/prisma", () => ({
  default: {
    contactMessage: { create: vi.fn(), findMany: vi.fn() },
  },
}));

vi.mock("../../src/services/email.service", () => ({
  sendContactNotification: vi.fn().mockResolvedValue(undefined),
}));

import prisma from "../../src/lib/prisma";
import { sendContactNotification } from "../../src/services/email.service";
import { submitContactMessage, getContactMessages } from "../../src/services/contact.service";

const mockedPrisma = vi.mocked(prisma, true);

const messageRow = (over: Record<string, any> = {}) => ({
  id: 1,
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "Do you stock a roof rack for a 2019 Jimny?",
  createdAt: new Date("2026-01-01"),
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("submitContactMessage", () => {
  it("stores the message", async () => {
    mockedPrisma.contactMessage.create.mockResolvedValue(messageRow() as any);

    await submitContactMessage({ name: "Ada Lovelace", email: "ada@example.com", message: "Hi" });

    expect(mockedPrisma.contactMessage.create).toHaveBeenCalledWith({
      data: { name: "Ada Lovelace", email: "ada@example.com", message: "Hi" },
    });
  });

  it("fires a notification email with the saved message", async () => {
    mockedPrisma.contactMessage.create.mockResolvedValue(messageRow() as any);

    await submitContactMessage({ name: "Ada Lovelace", email: "ada@example.com", message: "Hi" });

    expect(sendContactNotification).toHaveBeenCalledWith({
      name: "Ada Lovelace",
      email: "ada@example.com",
      message: "Do you stock a roof rack for a 2019 Jimny?",
    });
  });

  it("still confirms success to the sender even when the notification email fails", async () => {
    mockedPrisma.contactMessage.create.mockResolvedValue(messageRow() as any);
    vi.mocked(sendContactNotification).mockRejectedValueOnce(new Error("Resend down"));

    // The message is already durably stored — a mail-provider outage must not
    // turn into a false "failed to send" for the visitor.
    await expect(
      submitContactMessage({ name: "Ada", email: "ada@example.com", message: "Hi" })
    ).resolves.toMatchObject({ message: expect.any(String) });
  });

  it("returns a confirmation message", async () => {
    mockedPrisma.contactMessage.create.mockResolvedValue(messageRow() as any);

    const result = await submitContactMessage({ name: "Ada", email: "ada@example.com", message: "Hi" });

    expect(result.message).toMatch(/thanks|back to you/i);
  });
});

describe("getContactMessages", () => {
  it("returns messages newest first", async () => {
    mockedPrisma.contactMessage.findMany.mockResolvedValue([messageRow()] as any);

    await getContactMessages();

    expect(mockedPrisma.contactMessage.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });
  });
});
