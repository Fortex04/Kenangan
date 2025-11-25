import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudentSchema = createInsertSchema(students).pick({
  name: true,
  phoneNumber: true,
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  title: text("title"),
  description: text("description"),
  fileData: text("file_data"), // Store base64 or file data
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const insertPhotoSchema = createInsertSchema(photos).pick({
  description: true,
  fileData: true,
}).extend({
  title: z.string().optional(),
  fileData: z.string().optional(),
});

export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photos.$inferSelect;

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title"),
  description: text("description"),
  fileData: text("file_data"), // Store video as base64
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const insertVideoSchema = createInsertSchema(videos).pick({
  title: true,
  description: true,
  fileData: true,
}).extend({
  fileData: z.string().optional(),
});

export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  status: text("status").default("open"), // open or closed
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReportSchema = createInsertSchema(reports).pick({
  subject: true,
});

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

export const reportMessages = pgTable("report_messages", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull(),
  senderType: text("sender_type").notNull(), // 'user' or 'admin'
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReportMessageSchema = createInsertSchema(reportMessages).pick({
  reportId: true,
  senderType: true,
  message: true,
});

export type InsertReportMessage = z.infer<typeof insertReportMessageSchema>;
export type ReportMessage = typeof reportMessages.$inferSelect;
