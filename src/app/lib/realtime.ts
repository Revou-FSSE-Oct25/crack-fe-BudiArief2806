"use client";

import { io, type Socket } from "socket.io-client";
import { getToken } from "./auth";
import type { Booking, BookingMessage } from "./types";

const BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

export type BookingRealtimeReason =
  | "created"
  | "updated"
  | "status_changed"
  | "prescription_saved"
  | "doctor_review_submitted"
  | "deleted";

export type BookingUpdatedEvent = {
  type: "booking.updated";
  reason: BookingRealtimeReason;
  booking: Booking;
};

export type BookingDeletedEvent = {
  type: "booking.deleted";
  reason: "deleted";
  bookingId: string;
  userId?: string | null;
  doctorId?: string;
};

export type BookingMessageCreatedEvent = {
  type: "booking.message.created";
  bookingId: string;
  message: BookingMessage;
};

export type BookingRealtimeEvent = BookingUpdatedEvent | BookingDeletedEvent | BookingMessageCreatedEvent;

let socket: Socket | null = null;
let socketToken: string | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

function buildSocket() {
  const token = getToken();
  if (!isBrowser() || !token) return null;

  if (socket && socketToken === token) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socketToken = token;
  socket = io(BASE, {
    transports: ["websocket"],
    auth: { token },
  });

  return socket;
}

export function subscribeBookingRealtime(onEvent: (event: BookingRealtimeEvent) => void) {
  const client = buildSocket();
  if (!client) {
    return () => undefined;
  }

  const onUpdated = (payload: BookingUpdatedEvent) => onEvent(payload);
  const onDeleted = (payload: BookingDeletedEvent) => onEvent(payload);
  const onMessageCreated = (payload: BookingMessageCreatedEvent) => onEvent(payload);

  client.on("booking.updated", onUpdated);
  client.on("booking.deleted", onDeleted);
  client.on("booking.message.created", onMessageCreated);

  return () => {
    client.off("booking.updated", onUpdated);
    client.off("booking.deleted", onDeleted);
    client.off("booking.message.created", onMessageCreated);
  };
}

export function disconnectRealtime() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
  socketToken = null;
}
