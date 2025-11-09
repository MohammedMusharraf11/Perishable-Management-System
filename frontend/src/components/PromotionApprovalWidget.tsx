// import React, { useEffect, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Percent, Loader2, Package, X } from "lucide-react";
// import { toast } from "sonner";
// import { useAuth } from "@/contexts/AuthContext";

// interface PromotionSuggestion {
//   batch_id: string;
//   product_name: string;
//   category: string;
//   suggested_discount_percentage: number;
//   original_price: number;
//   suggested_price: number;
//   estimated_revenue: number;
//   expiry_date: string;
//   days_until_expiry: number;
//   status: "pending" | "approved" | "rejected";
//   approved_by_name?: string;
//   approved_at?: string;
//   rejection_reason?: string;
// }

// const PromotionApprovalWidget: React.FC = () => {
//   const { user } = useAuth();
//   const [suggestions, setSuggestions] = useState<PromotionSuggestion[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [approving, setApproving] = useState<string | null>(null);
//   const [rejecting, setRejecting] = useState<string | null>(null);
//   const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
//   const [showRejectModal, setShowRejectModal] = useState(false);
//   const [rejectReason, setRejectReason] = useState("");
//   const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
//   const [showApproveModal, setShowApproveModal] = useState(false);
//   const [customDiscount, setCustomDiscount] = useState<number>(0);

//   const fetchSuggestions = async () => {
//     setLoading(true);
//     try {
//       const res = await fetch("http://localhost:5000/api/promotions/suggestions");
//       if (!res.ok) throw new Error("Failed to fetch promotions");
//       const json = await res.json();
//       setSuggestions(json.suggestions || []);
//     } catch (err) {
//       console.error(err);
//       toast.error("Failed to load promotions");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchSuggestions();
//   }, []);

//   const approveDiscount = async (batchId: string, approved_discount: number) => {
//     setApproving(batchId);
//     try {
//       const res = await fetch(`http://localhost:5000/api/promotions/${batchId}/approve`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "x-user-id": user?.id || "",
//           "x-user-name": user?.name || "",
//         },
//         body: JSON.stringify({ approved_discount }),
//       });
//       if (!res.ok) throw new Error("Failed to approve discount");
//       toast.success(`✅ Discount ${approved_discount}% approved!`);
//       setShowApproveModal(false);
//       await fetchSuggestions();
//     } catch {
//       toast.error("Failed to approve discount");
//     } finally {
//       setApproving(null);
//     }
//   };

//   const handleReject = async () => {
//     if (!rejectReason.trim()) return toast.error("Please provide a reason!");
//     setRejecting(selectedBatchId);
//     try {
//       const res = await fetch(`http://localhost:5000/api/promotions/${selectedBatchId}/reject`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "x-user-id": user?.id || "",
//           "x-user-name": user?.name || "",
//         },
//         body: JSON.stringify({ reason: rejectReason }),
//       });
//       if (!res.ok) throw new Error("Failed to reject discount");
//       toast.success("❌ Discount suggestion rejected.");
//       setShowRejectModal(false);
//       setRejectReason("");
//       await fetchSuggestions();
//     } catch {
//       toast.error("Failed to reject suggestion");
//     } finally {
//       setRejecting(null);
//     }
//   };

//   const openApproveModal = (batchId: string, suggested_discount: number) => {
//     setSelectedBatchId(batchId);
//     setCustomDiscount(suggested_discount);
//     setShowApproveModal(true);
//   };

//   const filteredSuggestions = suggestions.filter((s) => s.status === filter);

//   if (!user || user.role !== "Manager") return null;

//   return (
//     <motion.div className="w-full md:w-[440px] relative">
//       <Card className="glass border-2 border-primary/10 shadow-md">
//         <CardHeader className="flex justify-between items-center">
//           <CardTitle className="flex items-center gap-2 text-lg font-semibold">
//             <Percent className="text-primary h-5 w-5" />
//             Discount Management
//           </CardTitle>
//         </CardHeader>

//         <div className="flex justify-around px-4 py-2">
//           {["pending", "approved", "rejected"].map((type) => (
//             <button
//               key={type}
//               onClick={() => setFilter(type as any)}
//               className={`px-3 py-1 rounded-full text-sm font-semibold transition-all duration-150 ${
//                 filter === type
//                   ? type === "approved"
//                     ? "bg-green-600 text-white"
//                     : type === "rejected"
//                     ? "bg-red-600 text-white"
//                     : "bg-yellow-500 text-white"
//                   : "bg-gray-200 text-gray-700 hover:bg-gray-300"
//               }`}
//             >
//               {type.charAt(0).toUpperCase() + type.slice(1)}
//             </button>
//           ))}
//         </div>

//         <CardContent>
//           {loading ? (
//             <div className="flex justify-center items-center h-28">
//               <Loader2 className="animate-spin mr-2" /> Loading...
//             </div>
//           ) : filteredSuggestions.length === 0 ? (
//             <p className="text-sm text-gray-500 italic text-center">
//               No {filter} promotions 🎉
//             </p>
//           ) : (
//             <ul className="divide-y divide-gray-200">
//               {filteredSuggestions.map((s) => (
//                 <li key={s.batch_id} className="py-2 flex justify-between items-center">
//                   <div>
//                     <div className="flex items-center gap-2">
//                       <Package className="h-4 w-4 text-gray-500" />
//                       <span className="font-medium">{s.product_name}</span>
//                     </div>
//                     <div className="text-xs text-gray-500">
//                       Exp: {new Date(s.expiry_date).toLocaleDateString()} • {s.category}
//                     </div>
//                     <div className="text-xs mt-1">
//                       <span className="line-through text-muted-foreground">
//                         ₹{s.original_price}
//                       </span>{" "}
//                       → <b>₹{s.suggested_price}</b> ({s.suggested_discount_percentage}%)
//                     </div>

//                     {s.status === "approved" && (
//                       <div className="text-xs text-green-600 mt-1">
//                         ✅ Approved by {s.approved_by_name || "Manager"} on{" "}
//                         {s.approved_at ? new Date(s.approved_at).toLocaleDateString() : ""}
//                       </div>
//                     )}
//                     {s.status === "rejected" && (
//                       <div className="text-xs text-red-600 mt-1">
//                         ❌ Rejected by {s.approved_by_name || "Manager"} – {s.rejection_reason}
//                       </div>
//                     )}
//                   </div>

//                   {s.status === "pending" && (
//                     <div className="flex gap-2">
//                       <button
//                         className="px-2 py-1 bg-green-600 text-white rounded-md text-xs hover:bg-green-700"
//                         onClick={() =>
//                           openApproveModal(s.batch_id, s.suggested_discount_percentage)
//                         }
//                       >
//                         Approve
//                       </button>
//                       <button
//                         className="px-2 py-1 bg-red-600 text-white rounded-md text-xs hover:bg-red-700"
//                         onClick={() => {
//                           setSelectedBatchId(s.batch_id);
//                           setShowRejectModal(true);
//                         }}
//                       >
//                         Reject
//                       </button>
//                     </div>
//                   )}
//                 </li>
//               ))}
//             </ul>
//           )}
//         </CardContent>
//       </Card>

//       {/* Approve Modal with slider */}
//       <AnimatePresence>
//         {showApproveModal && (
//           <motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
//             <motion.div className="bg-white p-6 rounded-xl shadow-xl w-[90%] max-w-md relative">
//               <button
//                 onClick={() => setShowApproveModal(false)}
//                 className="absolute top-3 right-3 text-gray-500 hover:text-black"
//               >
//                 <X className="h-5 w-5" />
//               </button>
//               <h2 className="text-lg font-semibold mb-3">Approve Discount</h2>
//               <p className="text-sm text-gray-600 mb-4">
//                 Choose the discount percentage before approval.
//               </p>
//               <label className="block text-sm font-medium mb-2">
//                 Selected: {customDiscount}%
//               </label>
//               <input
//                 type="range"
//                 min="0"
//                 max="100"
//                 value={customDiscount}
//                 onChange={(e) => setCustomDiscount(Number(e.target.value))}
//                 className="w-full accent-green-600"
//               />
//               <div className="mt-4 flex justify-end gap-3">
//                 <button
//                   onClick={() => setShowApproveModal(false)}
//                   className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={() => approveDiscount(selectedBatchId!, customDiscount)}
//                   className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
//                 >
//                   Approve
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Reject Modal */}
//       <AnimatePresence>
//         {showRejectModal && (
//           <motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
//             <motion.div className="bg-white p-6 rounded-xl shadow-xl w-[90%] max-w-md relative">
//               <button
//                 onClick={() => setShowRejectModal(false)}
//                 className="absolute top-3 right-3 text-gray-500 hover:text-black"
//               >
//                 <X className="h-5 w-5" />
//               </button>
//               <h2 className="text-lg font-semibold mb-3">Reject Discount</h2>
//               <p className="text-sm text-gray-600 mb-4">
//                 Please enter a reason for rejecting this discount.
//               </p>
//               <textarea
//                 rows={4}
//                 value={rejectReason}
//                 onChange={(e) => setRejectReason(e.target.value)}
//                 className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-red-500"
//                 placeholder="Enter reason..."
//               />
//               <div className="mt-4 flex justify-end gap-3">
//                 <button
//                   onClick={() => setShowRejectModal(false)}
//                   className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleReject}
//                   className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
//                 >
//                   Reject
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.div>
//   );
// };

// export default PromotionApprovalWidget; old code above


import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Percent, Loader2, Package, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";

interface PromotionSuggestion {
  batch_id: string;
  product_name: string;
  category: string;
  suggested_discount_percentage: number;
  original_price: number;
  suggested_price: number;
  estimated_revenue: number;
  expiry_date: string;
  days_until_expiry: number;
  status: "pending" | "approved" | "rejected";
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
}

const PromotionApprovalWidget: React.FC = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<PromotionSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [customDiscount, setCustomDiscount] = useState<number>(0);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_BASE}/api/promotions/suggestions`);
      if (!res.ok) throw new Error("Failed to fetch promotions");
      const json = await res.json();
      setSuggestions(json.suggestions || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load promotions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const approveDiscount = async (batchId: string, approved_discount: number) => {
    setApproving(batchId);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_BASE}/api/promotions/${batchId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
          "x-user-name": user?.name || "",
        },
        body: JSON.stringify({ approved_discount }),
      });
      if (!res.ok) throw new Error("Failed to approve discount");
      toast.success(`✅ Discount ${approved_discount}% approved!`);
      setShowApproveModal(false);
      await fetchSuggestions();
    } catch {
      toast.error("Failed to approve discount");
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return toast.error("Please provide a reason!");
    setRejecting(selectedBatchId);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_BASE}/api/promotions/${selectedBatchId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
          "x-user-name": user?.name || "",
        },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (!res.ok) throw new Error("Failed to reject discount");
      toast.success("❌ Discount suggestion rejected.");
      setShowRejectModal(false);
      setRejectReason("");
      await fetchSuggestions();
    } catch {
      toast.error("Failed to reject suggestion");
    } finally {
      setRejecting(null);
    }
  };

  const openApproveModal = (batchId: string, suggested_discount: number) => {
    setSelectedBatchId(batchId);
    setCustomDiscount(suggested_discount);
    setShowApproveModal(true);
  };

  // 🧾 Generate Printable Labels (Task 2)
  const generateLabelsPDF = () => {
    const approvedItems = suggestions.filter((s) => s.status === "approved");
    if (!approvedItems.length) {
      toast.info("No approved promotions to print 🎉");
      return;
    }

    const pdf = new jsPDF();
    const x = 10;
    let y = 20;

    approvedItems.forEach((item, index) => {
      pdf.setFontSize(12);
      pdf.text(`Product: ${item.product_name}`, x, y);
      pdf.text(`Old Price: ₹${item.original_price}`, x, y + 7);
      pdf.text(`New Price: ₹${item.suggested_price}`, x, y + 14);
      pdf.text(`Discount: ${item.suggested_discount_percentage}%`, x, y + 21);
      pdf.text(`Exp: ${new Date(item.expiry_date).toLocaleDateString()}`, x, y + 28);

      // Generate barcode
      const canvas = document.createElement("canvas");
      JsBarcode(canvas, item.batch_id.slice(0, 8), {
        format: "CODE128",
        width: 1,
        height: 25,
      });
      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", x, y + 32, 60, 20);

      // Move to next label
      y += 65;
      if (y > 270) {
        pdf.addPage();
        y = 20;
      }
    });

    pdf.save("discount_labels.pdf");
  };

  const filteredSuggestions = suggestions.filter((s) => s.status === filter);

  if (!user || user.role !== "Manager") return null;

  return (
    <motion.div className="w-full relative">
      <Card className="glass border-2 border-primary/10 shadow-md">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Percent className="text-primary h-5 w-5" />
            Discount Management
          </CardTitle>
        </CardHeader>

        <div className="flex justify-around px-4 py-2">
          {["pending", "approved", "rejected"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type as any)}
              className={`px-3 py-1 rounded-full text-sm font-semibold transition-all duration-150 ${
                filter === type
                  ? type === "approved"
                    ? "bg-green-600 text-white"
                    : type === "rejected"
                    ? "bg-red-600 text-white"
                    : "bg-yellow-500 text-white"
                  : "bg-accent text-foreground hover:bg-accent/80"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* 🖨️ Print Labels Button for Approved */}
        {filter === "approved" && (
          <div className="flex justify-end px-4 mb-2">
            <button
              onClick={generateLabelsPDF}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1"
            >
              🖨️ Print Labels
            </button>
          </div>
        )}

        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-28">
              <Loader2 className="animate-spin mr-2" /> Loading...
            </div>
          ) : filteredSuggestions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground italic">
                No {filter} promotions 🎉
              </p>
            </div>
          ) : (
            <ul className="space-y-0">
              {filteredSuggestions.map((s) => (
                <li key={s.batch_id} className="py-3 flex justify-between items-start gap-3 border-b border-border/30 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-semibold text-sm">{s.product_name || "Unknown Product"}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1.5">
                      {s.category && <span className="mr-2">📦 {s.category}</span>}
                      {s.expiry_date && (
                        <span>
                          📅 Exp: {new Date(s.expiry_date).toLocaleDateString('en-IN', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs mt-1">
                      <span className="line-through text-muted-foreground">
                        ₹{s.original_price?.toFixed(2) || '0.00'}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-bold text-success">
                        ₹{s.suggested_price?.toFixed(2) || '0.00'}
                      </span>
                      <span className="px-2 py-0.5 bg-warning/20 text-warning-foreground rounded-full font-medium">
                        {s.suggested_discount_percentage}% OFF
                      </span>
                    </div>

                    {s.status === "approved" && (
                      <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <span>✅</span>
                        <span>Approved by {s.approved_by_name || "Manager"}</span>
                        {s.approved_at && (
                          <span className="text-muted-foreground">
                            • {new Date(s.approved_at).toLocaleDateString('en-IN')}
                          </span>
                        )}
                      </div>
                    )}
                    {s.status === "rejected" && (
                      <div className="text-xs text-red-600 mt-2">
                        <span>❌ Rejected</span>
                        {s.rejection_reason && <span> – {s.rejection_reason}</span>}
                      </div>
                    )}
                  </div>

                  {s.status === "pending" && (
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button
                        className="px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition-colors whitespace-nowrap"
                        onClick={() =>
                          openApproveModal(s.batch_id, s.suggested_discount_percentage)
                        }
                      >
                        Approve
                      </button>
                      <button
                        className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors whitespace-nowrap"
                        onClick={() => {
                          setSelectedBatchId(s.batch_id);
                          setShowRejectModal(true);
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Approve Modal */}
      <AnimatePresence>
        {showApproveModal && (
          <motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <motion.div className="glass p-6 rounded-xl shadow-xl w-[90%] max-w-md relative border-2 border-primary/20">
              <button
                onClick={() => setShowApproveModal(false)}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold mb-3">Approve Discount</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Choose the discount percentage before approval.
              </p>
              <label className="block text-sm font-medium mb-2">
                Selected: {customDiscount}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={customDiscount}
                onChange={(e) => setCustomDiscount(Number(e.target.value))}
                className="w-full accent-green-600"
              />
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 bg-accent rounded-lg hover:bg-accent/80 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => approveDiscount(selectedBatchId!, customDiscount)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Approve
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <motion.div className="glass p-6 rounded-xl shadow-xl w-[90%] max-w-md relative border-2 border-primary/20">
              <button
                onClick={() => setShowRejectModal(false)}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold mb-3">Reject Discount</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Please enter a reason for rejecting this discount.
              </p>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-red-500"
                placeholder="Enter reason..."
              />
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-accent rounded-lg hover:bg-accent/80 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  Reject
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PromotionApprovalWidget;
