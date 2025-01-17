import {
  Injectable
} from '@nestjs/common';
import { DraftMedicinePlanDto } from 'src/dtos/draft-medicine-plan.dto';
import { InvoiceDto, InvoiceSummary, MedicineFee } from 'src/dtos/invoice.dto';
import { MedicinePlanDto } from 'src/dtos/medicine-plan.dto';
import { NotificationDto } from 'src/dtos/notification-dto';
import { PrescriptionDto } from 'src/dtos/prescription.dto';
import { DraftMedicinePlan } from 'src/entities/draft-medicine-plan.entity';
import { MedicinePlan } from 'src/entities/medicine-plan.entity';
import { Prescription } from 'src/entities/prescription.entity';
import { InvoiceStatus } from 'src/enums/invoice-status.enum';
import { InvoiceService } from 'src/services/invoice.service';
import { MedicinePlanService } from 'src/services/medicine-plan.service';
import { NotificationService } from 'src/services/notification.service';
import { PrescriptionService } from 'src/services/prescription.service';
import { DraftMedicinePlanService } from '../services/draft-medicine-plan.service';
import { MedicineService } from '../services/medicine.service';
import { IOrderPrescriptionTransactionControl } from './i-order-prescription-transaction.control';

@Injectable()
export class OrderPrescriptionTransactionControl implements IOrderPrescriptionTransactionControl {
  constructor(private readonly medicineService: MedicineService,
    private readonly draftMedicinePlanService: DraftMedicinePlanService,
    private readonly medicinePlanService: MedicinePlanService,
    private readonly prescriptionService: PrescriptionService,
    private readonly invoiceService: InvoiceService,
    private readonly notificationService: NotificationService
  ) { }

  async createPrescriptionRequest(createPrescriptionRequest: PrescriptionDto) {
    const createdDraftMedicinePlans = await this.draftMedicinePlanService.create(createPrescriptionRequest.draftMedicinePlans);
    return this.toPrescriptionResponse(createdDraftMedicinePlans);
  }

  async editPrescription(editPrescriptionRequest: PrescriptionDto) {
    const editedDraftMedicinePlans = await this.draftMedicinePlanService.edit(editPrescriptionRequest.draftMedicinePlans);
    return this.toPrescriptionResponse(editedDraftMedicinePlans);
  }

  async cancelPrescription(cancelPrescriptionRequest: PrescriptionDto) {
    const canceledDraftMedicinePlans = await this.draftMedicinePlanService.cancel(cancelPrescriptionRequest.draftMedicinePlans);
    return this.toPrescriptionResponse(canceledDraftMedicinePlans);
  }

  async confirmPrescription(confirmedPrescriptionRequest: PrescriptionDto) {
    const prescription = await this.createPrescription(confirmedPrescriptionRequest);
    const draftMedicinePlan = confirmedPrescriptionRequest.draftMedicinePlans;
    const medicinePlans = await this.createMedicinePlans(draftMedicinePlan);
    const invoice = await this.createInvoice(medicinePlans);
    await this.sendNotification(invoice);
    return this.toPrescriptionResponse(draftMedicinePlan, medicinePlans);
  }

  private async sendNotification(invoice: InvoiceDto) {
    const notification = new NotificationDto();
    notification.message = 'กรุณาชำระค่าบริการ เลขที่ใบแจ้งหนี้: ' + invoice.refId;
    notification.userId = '1';
    await this.notificationService.notify(notification);
  }

  private async createInvoice(medicinePlans: MedicinePlanDto[]) {
    const invoice = new InvoiceDto();
    invoice.status = InvoiceStatus.UNPAID;
    invoice.refId = 'INVOICE#' + Math.floor(1000 + Math.random() * 9000);
    const invoiceSummary = new InvoiceSummary();
    invoiceSummary.serviceFee = 500;
    invoiceSummary.medicineFee = [];
    let totalPrice = 500;
    for (let medicinePlan of medicinePlans) {
      let medicineFee = new MedicineFee();
      medicineFee.medicineName = medicinePlan.medicineName;
      medicineFee.amount = medicinePlan.amount;
      const medicine = await this.medicineService.findAll(medicinePlan.medicineName);
      medicineFee.price = medicineFee.amount * medicine[0].price;
      invoiceSummary.medicineFee.push(medicineFee);
      totalPrice = totalPrice + medicineFee.price;
    }
    invoice.price = totalPrice;
    invoice.summary = invoiceSummary;
    await this.invoiceService.create(invoice);
    return invoice;
  }

  private async createMedicinePlans(draftMedicinePlans: DraftMedicinePlanDto[]) {
    const medicinePlans = draftMedicinePlans.map(plan => this.toMedicinePlan(plan));
    await this.medicinePlanService.create(medicinePlans);
    return medicinePlans;
  }

  private async createPrescription(prescription: PrescriptionDto): Promise<Prescription> {
    return await this.prescriptionService.create(prescription);
  }

  toPrescriptionResponse(draftMedicinePlans: DraftMedicinePlan[], medicinePlans: MedicinePlan[] = []): PrescriptionDto {
    const prescriptionResponse = new PrescriptionDto();
    prescriptionResponse.draftMedicinePlans = draftMedicinePlans;
    prescriptionResponse.medicinePlans = medicinePlans;
    return prescriptionResponse;
  }

  toMedicinePlan(draftMedicinePlan: DraftMedicinePlan): MedicinePlanDto {
    const medicinePlan = new MedicinePlanDto();
    medicinePlan.dosage = draftMedicinePlan.dosage;
    medicinePlan.dosageMeals = draftMedicinePlan.dosageMeals;
    medicinePlan.medicineName = draftMedicinePlan.medicineName;
    medicinePlan.amount = draftMedicinePlan.amount;
    medicinePlan.remark = draftMedicinePlan.remark;
    medicinePlan.status = draftMedicinePlan.status;
    medicinePlan.dosageTimes = draftMedicinePlan.dosageTimes;
    return medicinePlan;
  }
}