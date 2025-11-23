import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema, insertPhotoSchema, insertVideoSchema } from "@shared/schema";
import * as cheerio from "cheerio";

export async function registerRoutes(app: Express): Promise<Server> {
  // Students routes
  app.get("/api/students", async (req, res) => {
    try {
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(validatedData);
      res.status(201).json(student);
    } catch (error) {
      res.status(400).json({ error: "Invalid student data" });
    }
  });

  app.put("/api/students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertStudentSchema.partial().parse(req.body);
      const student = await storage.updateStudent(id, validatedData);
      if (!student) {
        res.status(404).json({ error: "Student not found" });
        return;
      }
      res.json(student);
    } catch (error) {
      res.status(400).json({ error: "Invalid student data" });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteStudent(id);
      if (!success) {
        res.status(404).json({ error: "Student not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete student" });
    }
  });

  // Helper function to resolve Google Photos share links
  async function resolvePhotoUrl(url: string): Promise<string> {
    try {
      if (!url.includes('photos.app.goo.gl')) {
        return url;
      }
      
      // For Google Photos short links, fetch and parse the HTML to extract image URL
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Try to extract image URL from various locations in the page
      let imageUrl = '';
      
      // Try meta og:image tag first (most reliable)
      imageUrl = $('meta[property="og:image"]').attr('content') || '';
      
      // If not found, try to find it in the page data or images
      if (!imageUrl) {
        // Look for data-src in images within the page
        const images = $('img[data-src]');
        if (images.length > 0) {
          imageUrl = images.first().attr('data-src') || '';
        }
      }
      
      // If still not found, try regular src attributes
      if (!imageUrl) {
        const imgs = $('img[src*="googleusercontent"]');
        if (imgs.length > 0) {
          imageUrl = imgs.first().attr('src') || '';
        }
      }
      
      // If we found an image URL, optimize it
      if (imageUrl) {
        if (imageUrl.includes('lh3.googleusercontent.com') || imageUrl.includes('googleusercontent.com')) {
          if (!imageUrl.includes('=w')) {
            return imageUrl + (imageUrl.includes('?') ? '&' : '?') + 'w=1000';
          }
        }
        return imageUrl;
      }
      
      // Fallback: return the response URL if we couldn't extract an image
      console.warn('Could not extract image URL from Google Photos page, using fallback');
      return response.url;
    } catch (error) {
      console.error('Error resolving photo URL:', error);
      return url;
    }
  }

  // Photos routes
  app.get("/api/photos/resolve-url", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        res.status(400).json({ error: "URL parameter required" });
        return;
      }
      
      const resolvedUrl = await resolvePhotoUrl(url);
      res.json({ url: resolvedUrl });
    } catch (error) {
      console.error("Error resolving URL:", error);
      res.status(500).json({ error: "Failed to resolve URL" });
    }
  });

  // Image proxy endpoint to bypass CORS issues
  app.get("/api/photos/proxy", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        res.status(400).json({ error: "URL parameter required" });
        return;
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://photos.google.com/'
        }
      });

      if (!response.ok) {
        res.status(response.status).json({ error: "Failed to fetch image" });
        return;
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const buffer = await response.arrayBuffer();

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("Error proxying image:", error);
      res.status(500).json({ error: "Failed to proxy image" });
    }
  });

  app.get("/api/photos", async (req, res) => {
    try {
      const photos = await storage.getAllPhotos();
      res.json(photos);
    } catch (error) {
      console.error("Error fetching photos:", error);
      res.status(500).json({ error: "Failed to fetch photos" });
    }
  });

  app.post("/api/photos", async (req, res) => {
    try {
      const validatedData = insertPhotoSchema.parse(req.body);
      const photo = await storage.createPhoto(validatedData);
      res.status(201).json(photo);
    } catch (error) {
      res.status(400).json({ error: "Invalid photo data" });
    }
  });

  app.delete("/api/photos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePhoto(id);
      if (!success) {
        res.status(404).json({ error: "Photo not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete photo" });
    }
  });

  // Videos routes
  app.get("/api/videos", async (req, res) => {
    try {
      const videos = await storage.getAllVideos();
      res.json(videos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  app.post("/api/videos", async (req, res) => {
    try {
      const validatedData = insertVideoSchema.parse(req.body);
      const video = await storage.createVideo(validatedData);
      res.status(201).json(video);
    } catch (error) {
      res.status(400).json({ error: "Invalid video data" });
    }
  });

  app.delete("/api/videos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteVideo(id);
      if (!success) {
        res.status(404).json({ error: "Video not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete video" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
