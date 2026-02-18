import mongoose, { Document } from 'mongoose';
import { Submission as ISubmission, AssessmentResult as IAssessmentResult } from '../types';
export interface SubmissionDocument extends Omit<ISubmission, '_id'>, Document {
}
export interface AssessmentResultDocument extends Omit<IAssessmentResult, '_id'>, Document {
}
export declare const Submission: mongoose.Model<SubmissionDocument, {}, {}, {}, mongoose.Document<unknown, {}, SubmissionDocument, {}, {}> & SubmissionDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export declare const AssessmentResult: mongoose.Model<AssessmentResultDocument, {}, {}, {}, mongoose.Document<unknown, {}, AssessmentResultDocument, {}, {}> & AssessmentResultDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Submission.d.ts.map