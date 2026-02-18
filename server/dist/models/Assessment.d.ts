import mongoose, { Document } from 'mongoose';
import { Assessment as IAssessment } from '../types';
export interface AssessmentDocument extends Omit<IAssessment, '_id'>, Document {
}
export declare const Assessment: mongoose.Model<AssessmentDocument, {}, {}, {}, mongoose.Document<unknown, {}, AssessmentDocument, {}, {}> & AssessmentDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Assessment.d.ts.map