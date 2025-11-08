// // backend/src/controllers/promotion.controller.js
// import { supabase } from "../config/supabaseClient.js";

// /* =======================================================================
//    🌟 GET DISCOUNT SUGGESTIONS
//    ======================================================================= */
// export const getDiscountSuggestions = async (req, res) => {
//   try {
//     // 1️⃣ Fetch items that are expiring soon
//     const { data: expiring, error } = await supabase
//       .from("v_active_inventory")
//       .select(
//         "batch_id, product_name, category, base_price, expiry_date, days_until_expiry, quantity, status"
//       )
//       .eq("status", "EXPIRING_SOON");

//     if (error) throw error;
//     if (!expiring?.length)
//       return res.status(200).json({ success: true, suggestions: [] });

//     // 2️⃣ Fetch already stored suggestions
//     const { data: existing, error: existErr } = await supabase
//       .from("discount_suggestions")
//       .select("batch_id, status");

//     if (existErr) throw existErr;

//     const existingMap = new Map(existing.map((s) => [s.batch_id, s.status]));

//     // 3️⃣ Only include pending/new ones
//     const pendingItems = expiring.filter(
//       (item) =>
//         !existingMap.has(item.batch_id) ||
//         existingMap.get(item.batch_id) === "pending"
//     );

//     // 4️⃣ Compute new discount suggestions
//     const suggestions = pendingItems.map((item) => {
//       let discount = 0;
//       if (item.days_until_expiry <= 0) discount = 75;
//       else if (item.days_until_expiry <= 1) discount = 50;
//       else discount = 25;

//       const suggested_price = parseFloat(
//         (item.base_price * (1 - discount / 100)).toFixed(2)
//       );
//       const estimated_revenue = parseFloat(
//         (item.quantity * suggested_price).toFixed(2)
//       );

//       return {
//         batch_id: item.batch_id,
//         product_name: item.product_name,
//         category: item.category,
//         suggested_discount_percentage: discount,
//         original_price: item.base_price,
//         suggested_price,
//         estimated_revenue,
//         status: "pending",
//         expiry_date: item.expiry_date,
//         days_until_expiry: item.days_until_expiry,
//       };
//     });

//     // 5️⃣ Upsert safely
//     const { error: insertError } = await supabase
//       .from("discount_suggestions")
//       .upsert(
//         suggestions.map((s) => ({
//           batch_id: s.batch_id,
//           suggested_discount_percentage: s.suggested_discount_percentage,
//           estimated_revenue: s.estimated_revenue,
//           status: "pending",
//         })),
//         { onConflict: "batch_id" }
//       );

//     if (insertError) throw insertError;

//     console.log(`✅ Synced ${suggestions.length} discount suggestions`);
//     return res.status(200).json({ success: true, suggestions });
//   } catch (err) {
//     console.error("🔥 Error fetching discount suggestions:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

// /* =======================================================================
//    ✅ APPROVE DISCOUNT (Manager-selected %)
//    ======================================================================= */
// export const approveDiscount = async (req, res) => {
//   try {
//     const { id } = req.params; // batch_id
//     const { approved_discount } = req.body;
//     const managerId = req.headers["x-user-id"];

//     // 1️⃣ Validate manager
//     const { data: manager, error: mgrErr } = await supabase
//       .from("pms_users")
//       .select("id, name, role")
//       .eq("id", managerId)
//       .single();

//     if (mgrErr || !manager)
//       return res
//         .status(400)
//         .json({ success: false, message: "Manager not found in pms_users" });

//     // 2️⃣ Get suggestion
//     const { data: suggestion, error: sErr } = await supabase
//       .from("discount_suggestions")
//       .select("batch_id, suggested_discount_percentage")
//       .eq("batch_id", id)
//       .maybeSingle();

//     if (sErr || !suggestion)
//       return res
//         .status(404)
//         .json({ success: false, message: "Suggestion not found" });

//     const discountToApply =
//       approved_discount ?? suggestion.suggested_discount_percentage;

//     // 3️⃣ Get item base price
//     const { data: item, error: iErr } = await supabase
//       .from("v_active_inventory")
//       .select("batch_id, base_price")
//       .eq("batch_id", id)
//       .maybeSingle();

//     if (iErr || !item)
//       return res
//         .status(404)
//         .json({ success: false, message: "Item not found in inventory" });

//     const newPrice = parseFloat(
//       (item.base_price * (1 - discountToApply / 100)).toFixed(2)
//     );

//     // 4️⃣ Update stock_batches
//     const { error: uErr } = await supabase
//       .from("stock_batches")
//       .update({
//         current_discount_percentage: discountToApply,
//         discounted_price: newPrice,
//         discount_approved: true,
//         updated_at: new Date().toISOString(),
//       })
//       .eq("id", id);

//     if (uErr) throw uErr;

//     // 5️⃣ Update discount_suggestions (✅ fixed column name)
//     const { error: updateErr } = await supabase
//       .from("discount_suggestions")
//       .update({
//         status: "approved",
//         approved_discount_percentage: discountToApply, // ✅ correct column
//         approved_by: manager.id,
//         approved_by_name: manager.name,
//         approved_at: new Date().toISOString(),
//       })
//       .eq("batch_id", id);

//     if (updateErr) throw updateErr;

//     // 6️⃣ Log action
//     await supabase.from("audit_logs").insert([
//       {
//         action: "APPROVE_DISCOUNT",
//         entity: "discount_suggestions",
//         entity_id: id,
//         performed_by: manager.name,
//         details: `Manager ${manager.name} approved ${discountToApply}% discount for batch ${id}`,
//       },
//     ]);

//     return res.status(200).json({
//       success: true,
//       message: `✅ ${discountToApply}% discount approved by ${manager.name}`,
//       new_price: newPrice,
//     });
//   } catch (err) {
//     console.error("❌ Error approving discount:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

// /* =======================================================================
//    ❌ REJECT DISCOUNT (with reason)
//    ======================================================================= */
// export const rejectDiscount = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { reason } = req.body;
//     const managerId = req.headers["x-user-id"];

//     if (!reason)
//       return res
//         .status(400)
//         .json({ success: false, message: "Rejection reason required" });

//     // 1️⃣ Validate manager
//     const { data: manager, error: mgrErr } = await supabase
//       .from("pms_users")
//       .select("id, name, role")
//       .eq("id", managerId)
//       .single();

//     if (mgrErr || !manager)
//       return res
//         .status(400)
//         .json({ success: false, message: "Manager not found in pms_users" });

//     // 2️⃣ Update discount_suggestions
//     const { error: rErr } = await supabase
//       .from("discount_suggestions")
//       .update({
//         status: "rejected",
//         rejection_reason: reason,
//         approved_by: manager.id,
//         approved_by_name: manager.name,
//         updated_at: new Date().toISOString(),
//       })
//       .eq("batch_id", id);

//     if (rErr) throw rErr;

//     // 3️⃣ Log
//     await supabase.from("audit_logs").insert([
//       {
//         action: "REJECT_DISCOUNT",
//         entity: "discount_suggestions",
//         entity_id: id,
//         performed_by: manager.name,
//         details: `Manager ${manager.name} rejected discount for batch ${id}. Reason: ${reason}`,
//       },
//     ]);

//     return res.status(200).json({
//       success: true,
//       message: `❌ Discount rejected by ${manager.name}`,
//     });
//   } catch (err) {
//     console.error("❌ Error rejecting discount:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };


// backend/src/controllers/promotion.controller.js
import { supabase } from "../config/supabaseClient.js";

/* =======================================================================
   🌟 GET DISCOUNT SUGGESTIONS (Returns ALL statuses)
   ======================================================================= */
export const getDiscountSuggestions = async (req, res) => {
  try {
    console.log("🧠 Fetching discount suggestions...");

    // 1️⃣ Fetch already existing suggestions
    const { data: existing, error: existErr } = await supabase
      .from("discount_suggestions")
      .select("*");

    if (existErr) throw existErr;

    // 2️⃣ Fetch expiring soon items (for new pending suggestions)
    const { data: expiring, error: expErr } = await supabase
      .from("v_active_inventory")
      .select(
        "batch_id, product_name, category, base_price, expiry_date, days_until_expiry, quantity, status"
      )
      .eq("status", "EXPIRING_SOON");

    if (expErr) throw expErr;

    const existingMap = new Map(existing.map((e) => [e.batch_id, e.status]));

    // 3️⃣ Find new ones not yet in suggestions
    const newPending = expiring.filter((item) => !existingMap.has(item.batch_id));

    // 4️⃣ Compute and upsert new pending suggestions
    const suggestionsToAdd = newPending.map((item) => {
      let discount = 0;
      if (item.days_until_expiry <= 0) discount = 75;
      else if (item.days_until_expiry <= 1) discount = 50;
      else discount = 25;

      const suggested_price = parseFloat(
        (item.base_price * (1 - discount / 100)).toFixed(2)
      );
      const estimated_revenue = parseFloat(
        (item.quantity * suggested_price).toFixed(2)
      );

      return {
        batch_id: item.batch_id,
        product_name: item.product_name,
        category: item.category,
        suggested_discount_percentage: discount,
        original_price: item.base_price,
        suggested_price,
        estimated_revenue,
        status: "pending",
        expiry_date: item.expiry_date,
        days_until_expiry: item.days_until_expiry,
        updated_at: new Date().toISOString(),
      };
    });

    if (suggestionsToAdd.length > 0) {
      const { error: upsertErr } = await supabase
        .from("discount_suggestions")
        .upsert(suggestionsToAdd, { onConflict: "batch_id" });
      if (upsertErr) throw upsertErr;
      console.log(`✅ Added ${suggestionsToAdd.length} new pending suggestions`);
    }

    // 5️⃣ Fetch everything again (approved + pending + rejected)
    const { data: all, error: allErr } = await supabase
      .from("discount_suggestions")
      .select("*")
      .order("updated_at", { ascending: false });

    if (allErr) throw allErr;

    console.log(`✅ Returned ${all.length} total discount suggestions`);
    return res.status(200).json({ success: true, suggestions: all });
  } catch (err) {
    console.error("🔥 Error fetching discount suggestions:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* =======================================================================
   ✅ APPROVE DISCOUNT (Manager-selected %)
   ======================================================================= */
export const approveDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved_discount } = req.body;
    const managerId = req.headers["x-user-id"];

    const { data: manager, error: mgrErr } = await supabase
      .from("pms_users")
      .select("id, name, role")
      .eq("id", managerId)
      .single();

    if (mgrErr || !manager)
      return res.status(400).json({ success: false, message: "Manager not found" });

    const { data: suggestion } = await supabase
      .from("discount_suggestions")
      .select("batch_id, suggested_discount_percentage")
      .eq("batch_id", id)
      .maybeSingle();

    const discountToApply =
      approved_discount ?? suggestion?.suggested_discount_percentage ?? 0;

    const { data: item } = await supabase
      .from("v_active_inventory")
      .select("batch_id, base_price")
      .eq("batch_id", id)
      .maybeSingle();

    const newPrice = parseFloat(
      (item.base_price * (1 - discountToApply / 100)).toFixed(2)
    );

    await supabase
      .from("stock_batches")
      .update({
        current_discount_percentage: discountToApply,
        discounted_price: newPrice,
        discount_approved: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    await supabase
      .from("discount_suggestions")
      .update({
        status: "approved",
        approved_discount_percentage: discountToApply,
        approved_by: manager.id,
        approved_by_name: manager.name,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("batch_id", id);

    await supabase.from("audit_logs").insert([
      {
        action: "APPROVE_DISCOUNT",
        entity: "discount_suggestions",
        entity_id: id,
        performed_by: manager.name,
        details: `Manager ${manager.name} approved ${discountToApply}% discount for batch ${id}`,
      },
    ]);

    return res.status(200).json({
      success: true,
      message: `✅ ${discountToApply}% discount approved by ${manager.name}`,
    });
  } catch (err) {
    console.error("❌ Error approving discount:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* =======================================================================
   ❌ REJECT DISCOUNT (with reason)
   ======================================================================= */
export const rejectDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const managerId = req.headers["x-user-id"];

    if (!reason)
      return res.status(400).json({ success: false, message: "Reason required" });

    const { data: manager } = await supabase
      .from("pms_users")
      .select("id, name, role")
      .eq("id", managerId)
      .single();

    await supabase
      .from("discount_suggestions")
      .update({
        status: "rejected",
        rejection_reason: reason,
        approved_by: manager.id,
        approved_by_name: manager.name,
        updated_at: new Date().toISOString(),
      })
      .eq("batch_id", id);

    await supabase.from("audit_logs").insert([
      {
        action: "REJECT_DISCOUNT",
        entity: "discount_suggestions",
        entity_id: id,
        performed_by: manager.name,
        details: `Manager ${manager.name} rejected discount for batch ${id}. Reason: ${reason}`,
      },
    ]);

    return res
      .status(200)
      .json({ success: true, message: `❌ Discount rejected by ${manager.name}` });
  } catch (err) {
    console.error("❌ Error rejecting discount:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
