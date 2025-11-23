import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, sql } from 'drizzle-orm';
import { 
  users, 
  students,
  photos,
  videos,
  type User, 
  type InsertUser,
  type Student,
  type InsertStudent,
  type Photo,
  type InsertPhoto,
  type Video,
  type InsertVideo
} from "@shared/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  
  getAllPhotos(): Promise<Photo[]>;
  getAllPhotosMetadata(): Promise<Photo[]>;
  getPhoto(id: number): Promise<Photo | undefined>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  deletePhoto(id: number): Promise<boolean>;
  
  getAllVideos(): Promise<Video[]>;
  getVideo(id: number): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  deleteVideo(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getAllStudents(): Promise<Student[]> {
    return await db.select().from(students);
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const result = await db.select().from(students).where(eq(students.id, id));
    return result[0];
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const result = await db.insert(students).values(student).returning();
    return result[0];
  }

  async updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined> {
    const result = await db.update(students).set(student).where(eq(students.id, id)).returning();
    return result[0];
  }

  async deleteStudent(id: number): Promise<boolean> {
    const result = await db.delete(students).where(eq(students.id, id)).returning();
    return result.length > 0;
  }

  async getAllPhotos(): Promise<Photo[]> {
    return await db.select().from(photos);
  }

  async getAllPhotosMetadata(): Promise<Photo[]> {
    // Return all photos with fileData for gallery display
    return await db.select().from(photos);
  }

  async getPhoto(id: number): Promise<Photo | undefined> {
    const result = await db.select().from(photos).where(eq(photos.id, id));
    return result[0];
  }

  async createPhoto(photo: InsertPhoto): Promise<Photo> {
    const result = await db.insert(photos).values(photo).returning();
    return result[0];
  }

  async deletePhoto(id: number): Promise<boolean> {
    const result = await db.delete(photos).where(eq(photos.id, id)).returning();
    return result.length > 0;
  }

  async getAllVideos(): Promise<Video[]> {
    return await db.select().from(videos);
  }

  async getVideo(id: number): Promise<Video | undefined> {
    const result = await db.select().from(videos).where(eq(videos.id, id));
    return result[0];
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    const result = await db.insert(videos).values(video).returning();
    return result[0];
  }

  async deleteVideo(id: number): Promise<boolean> {
    const result = await db.delete(videos).where(eq(videos.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
