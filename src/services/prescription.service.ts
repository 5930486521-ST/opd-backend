import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PrescriptionDto } from 'src/dtos/prescription.dto';
import { Prescription, PrescriptionDocument } from 'src/entities/prescription.entity';

@Injectable()
export class PrescriptionService {
  constructor(
    @InjectModel(Prescription.name) private readonly model: Model<PrescriptionDocument>,
  ) { }

  async create(): Promise<Prescription> {
    const prescription = new PrescriptionDto();
    prescription.status = 'CREATED'
    return await this.model.create(prescription);
  }
}