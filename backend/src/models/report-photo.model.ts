import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('report_photos')
export class ReportPhoto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_id' })
  reportId: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'file_path' })
  filePath: string;

  @Column({ name: 'file_size', type: 'integer' })
  fileSize: number;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({ type: 'text', nullable: true })
  caption?: string;

  @Column({ name: 'latitude', type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @Column({ name: 'longitude', type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude?: number;

  @Column({ name: 'gps_accuracy', type: 'decimal', precision: 10, scale: 2, nullable: true })
  gpsAccuracy?: number;

  @Column({ name: 'photo_timestamp', type: 'timestamp', nullable: true })
  photoTimestamp?: Date;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
