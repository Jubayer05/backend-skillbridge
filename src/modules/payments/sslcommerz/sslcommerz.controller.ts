import type { Request, Response } from "express";

import { prisma } from "../../../lib/prisma.js";
import { sendZodError } from "../../../lib/zod-response.js";
import { createBookingService, cancelBookingBySystem } from "../../bookings/booking.service.js";
import { sslcommerzInitBodySchema } from "./sslcommerz.schemas.js";
import { getFrontendOrigin, sslcommerzInitPayment } from "./sslcommerz.service.js";

function frontendResultUrl(params: Record<string, string>): string {
  const url = new URL(`${getFrontendOrigin()}/checkout/payment/sslcommerz/result`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

export async function initSslcommerzPayment(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized", message: "Login required" });
    return;
  }

  const parsed = sslcommerzInitBodySchema.safeParse(req.body);
  if (!parsed.success) {
    sendZodError(res, parsed.error);
    return;
  }

  try {
    const booking = await createBookingService(userId, {
      availabilitySlotId: parsed.data.availabilitySlotId,
      paymentMethod: "SSLCOMMERZ",
      ...(parsed.data.notes?.trim()
        ? { notes: parsed.data.notes.trim() }
        : {}),
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    if (!user?.email) {
      res.status(400).json({ error: "Validation Error", message: "User email is required for payment" });
      return;
    }

    const { gatewayUrl } = await sslcommerzInitPayment({
      tranId: booking.id,
      amount: Number(booking.totalPrice).toFixed(2),
      customer: {
        name: user.name ?? "Student",
        email: user.email,
      },
      product: {
        name: booking.slotName || "Tutoring session",
        category: booking.subject?.category.name ?? "Tutoring",
      },
      metadata: { bookingId: booking.id },
    });

    res.status(200).json({
      message: "SSLCommerz session created",
      data: { gatewayUrl, bookingId: booking.id },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to initialize payment";
    res.status(500).json({ error: "Payment Error", message });
  }
}

function readTranId(req: Request): string | null {
  const fromBody =
    typeof req.body?.tran_id === "string" ? req.body.tran_id : undefined;
  const fromQuery =
    typeof req.query?.tran_id === "string" ? req.query.tran_id : undefined;
  const tranId = (fromBody ?? fromQuery ?? "").trim();
  return tranId ? tranId : null;
}

export async function sslcommerzSuccess(req: Request, res: Response) {
  const tranId = readTranId(req);
  if (!tranId) {
    res.redirect(frontendResultUrl({ status: "success", bookingId: "" }));
    return;
  }
  res.redirect(frontendResultUrl({ status: "success", bookingId: tranId }));
}

export async function sslcommerzFail(req: Request, res: Response) {
  const tranId = readTranId(req);
  if (tranId) {
    await cancelBookingBySystem(tranId);
  }
  res.redirect(frontendResultUrl({ status: "failed", bookingId: tranId ?? "" }));
}

export async function sslcommerzCancel(req: Request, res: Response) {
  const tranId = readTranId(req);
  if (tranId) {
    await cancelBookingBySystem(tranId);
  }
  res.redirect(frontendResultUrl({ status: "cancelled", bookingId: tranId ?? "" }));
}

