import mongoose from "mongoose";

export interface JobDoc {
  location: string;
  url: string;
  company: string;
  title: string;
  content: string;
  when: string;
  source: string;
  hashtags: string[];
}

const jobSchema = new mongoose.Schema({
  location: { type: String, required: true },
  url: { type: String, required: true },
  company: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  when: { type: String, required: true },
  source: { type: String, required: true },
  hashtags: { type: [String], required: true },
});

export const JobModel =
  mongoose.models.Job || mongoose.model<JobDoc>("Job", jobSchema);
