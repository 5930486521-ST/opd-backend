import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DoctorCoordinator } from './coordinators/doctor.coordinator';
import { PatientCoordinator } from './coordinators/patient.coordinator';
import { PharmacistCoordinator} from './coordinators/pharmacist.coordinator';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb+srv://opd:opdsdd@cluster0.2soll.mongodb.net/opd?retryWrites=true&w=majority'),
    DoctorCoordinator,
    PatientCoordinator,
    PharmacistCoordinator
  ]
})
export class AppModule {}
