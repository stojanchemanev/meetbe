import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Button } from "../ui";
import { AppointmentWithRelations } from "@/src/types";

interface CancelModalProps {
    appointment: AppointmentWithRelations;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
}

export default function CancelModal({
    appointment,
    onClose,
    onConfirm,
}: CancelModalProps) {
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleConfirm = async () => {
        if (!reason.trim()) return;
        setSubmitting(true);
        await onConfirm(reason.trim());
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            </div>
                            <h3 className="text-lg font-black text-gray-900">
                                Cancel Appointment
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-900 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-1.5">
                        <p className="text-sm font-bold text-gray-900">
                            {appointment.business.name}
                        </p>
                        {appointment.service && (
                            <p className="text-sm text-gray-600">
                                {appointment.service.name}
                            </p>
                        )}
                        <p className="text-xs text-gray-500">
                            {format(
                                new Date(appointment.slot.start_time),
                                "EEEE, MMM d · h:mm a",
                            )}
                        </p>
                    </div>

                    <div className="mb-5">
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                            Reason for cancellation
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. Schedule conflict, feeling unwell..."
                            rows={3}
                            className="w-full text-sm border border-gray-200 rounded-xl p-3 text-gray-700 resize-none focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50"
                        />
                        {reason.length === 0 && (
                            <p className="text-[11px] text-gray-400 mt-1">
                                Required to cancel
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" onClick={onClose}>
                            Keep it
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleConfirm}
                            disabled={!reason.trim() || submitting}
                        >
                            {submitting ? "Cancelling..." : "Cancel Appointment"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
