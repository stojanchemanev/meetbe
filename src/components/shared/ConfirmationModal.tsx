import { format } from "date-fns";
import { X, CalendarIcon, AlertCircle } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui";

interface TimeSlot {
    start_time: Date;
    end_time: Date;
}

interface Employee {
    name: string;
    role: string;
    avatar: string;
}

interface Service {
    name: string;
    duration: number;
    price: string;
}

interface BookingConfirmationModalProps {
    slotToConfirm: TimeSlot;
    selectedEmployee: Employee;
    selectedService: Service;
    onClose: () => void;
    onConfirm: () => void;
}

function ConfirmationModal({
    slotToConfirm,
    selectedEmployee,
    selectedService,
    onClose,
    onConfirm,
}: BookingConfirmationModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-xl font-black text-gray-900">
                            Confirm Booking
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-900 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-start gap-4 p-3 bg-red-50 rounded-xl">
                            <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center shrink-0 text-red-600">
                                <CalendarIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-red-500 uppercase tracking-wider mb-1">
                                    When
                                </p>
                                <p className="text-sm font-bold text-gray-900">
                                    {format(
                                        slotToConfirm.start_time,
                                        "EEEE, MMM do",
                                    )}
                                </p>
                                <p className="text-sm font-medium text-gray-600">
                                    {format(slotToConfirm.start_time, "h:mm a")}{" "}
                                    - {format(slotToConfirm.end_time, "h:mm a")}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Image
                                    src={selectedEmployee.avatar}
                                    alt={selectedEmployee.name}
                                    className="w-8 h-8 rounded-full object-cover"
                                    width={32}
                                    height={32}
                                />
                                <div>
                                    <p className="text-xs font-bold text-gray-900">
                                        {selectedEmployee.name}
                                    </p>
                                    <p className="text-[10px] text-gray-500">
                                        {selectedEmployee.role}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                            <div>
                                <p className="text-xs font-bold text-gray-900">
                                    {selectedService.name}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                    {selectedService.duration} mins
                                </p>
                            </div>
                            <span className="font-black text-gray-900">
                                {selectedService.price}
                            </span>
                        </div>

                        <div className="flex gap-2 p-3 bg-blue-50 text-blue-800 rounded-lg text-xs font-medium">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            This appointment will be pending until confirmed by
                            the business.
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={onConfirm}>Request</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ConfirmationModal;
