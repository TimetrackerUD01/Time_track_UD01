/**
 * settings.js - JavaScript สำหรับหน้าตั้งค่าระบบ
 */

$(document).ready(function () {
  // ตรวจสอบการล็อกอิน
  if (!sessionStorage.getItem("admin_logged_in")) {
    window.location.href = "/admin/index.html";
    return;
  }

  // ตั้งค่าปีปัจจุบัน
  $("#currentYear").text(new Date().getFullYear());

  // โหลดการตั้งค่าทั้งหมด
  loadSettings();

  // โหลดสถานะระบบ
  loadSystemStatus();

  // ==== Event Handlers ====

  // เมื่อคลิกปุ่มเพิ่มกลุ่ม
  $("#add-group-btn").on("click", function () {
    // รีเซ็ตฟอร์ม
    $("#group_index").val("-1");
    $("#group_name").val("");
    $("#group_chat_id").val("");
    $("#group_active").prop("checked", true);
    $("#groupModalTitle").text("เพิ่มกลุ่ม Telegram");

    // เปิด Modal
    const modal = new bootstrap.Modal(
      document.getElementById("telegramGroupModal")
    );
    modal.show();
  });

  // เมื่อคลิกปุ่มบันทึกกลุ่ม
  $("#save-group-btn").on("click", function () {
    saveGroupData();
  });

  // เมื่อคลิกปุ่มทดสอบการแจ้งเตือน Telegram
  $("#test-notify-btn").on("click", function () {
    const token = $("#telegram_bot_token").val();
    if (!token) {
      showResult(
        "ข้อผิดพลาด",
        "กรุณากรอก Telegram Bot Token ก่อนทดสอบ",
        "danger"
      );
      return;
    }

    // อัปเดตรายการกลุ่มใน dropdown
    updateTestGroupDropdown();

    const testModal = new bootstrap.Modal(
      document.getElementById("testNotifyModal")
    );
    testModal.show();
  });

  // เมื่อคลิกปุ่มส่งข้อความทดสอบ Telegram
  $("#send-test-notify-btn").on("click", function () {
    sendTestNotification();
  });

  // เมื่อคลิกปุ่มทดสอบ Google Apps Script
  $("#test-gas-btn").on("click", function () {
    const gasUrl = $("#gas_web_app_url").val();
    if (!gasUrl) {
      showResult(
        "ข้อผิดพลาด",
        "กรุณากรอก Google Apps Script URL ก่อนทดสอบ",
        "danger"
      );
      return;
    }

    // อัปเดตรายการกลุ่มใน dropdown
    updateTestGasGroupDropdown();

    const testModal = new bootstrap.Modal(
      document.getElementById("testGasModal")
    );
    testModal.show();
  });

  // เมื่อคลิกปุ่มส่งข้อความทดสอบผ่าน Google Apps Script
  $("#send-test-gas-btn").on("click", function () {
    sendTestGasMessage();
  });

  // เมื่อคลิกปุ่มบันทึกการตั้งค่าทั้งหมด
  $("#save-all-btn").on("click", function () {
    saveAllSettings();
  });

  // ออกจากระบบ
  $("#logout-btn").on("click", function (e) {
    e.preventDefault();
    sessionStorage.removeItem("admin_logged_in");
    window.location.href = "/admin/index.html";
  });
});

// ==== ฟังก์ชันสำหรับการจัดการกลุ่ม Telegram ====

/**
 * บันทึกข้อมูลกลุ่ม Telegram
 */
function saveGroupData() {
  const index = $("#group_index").val();
  const name = $("#group_name").val();
  const chatId = $("#group_chat_id").val();
  const active = $("#group_active").is(":checked");

  if (!name || !chatId) {
    showResult("ข้อผิดพลาด", "กรุณากรอกข้อมูลให้ครบถ้วน", "danger");
    return;
  }

  // ปิด Modal
  $("#telegramGroupModal").modal("hide");

  // ดึงข้อมูลกลุ่มปัจจุบัน
  let groups = [];
  try {
    groups = JSON.parse($("#telegram_groups").val() || "[]");
  } catch (e) {
    groups = [];
  }

  if (index === "-1") {
    // เพิ่มกลุ่มใหม่
    groups.push({
      name: name,
      chat_id: chatId,
      active: active,
    });
  } else {
    // แก้ไขกลุ่มเดิม
    groups[parseInt(index)] = {
      name: name,
      chat_id: chatId,
      active: active,
    };
  }

  // อัปเดต input hidden
  $("#telegram_groups").val(JSON.stringify(groups));

  // แสดงรายการกลุ่มใหม่
  renderTelegramGroups(groups);

  showResult("สำเร็จ", "บันทึกข้อมูลกลุ่มเรียบร้อยแล้ว", "success");
}

/**
 * แสดงรายการกลุ่ม Telegram
 * @param {Array} groups - รายการกลุ่ม
 */
function renderTelegramGroups(groups) {
  const container = $("#telegram-groups-container");
  container.empty();

  if (groups.length === 0) {
    container.append(
      '<div class="alert alert-info">ยังไม่มีกลุ่ม Telegram คลิกปุ่ม "เพิ่มกลุ่ม" เพื่อเพิ่มกลุ่มใหม่</div>'
    );
    return;
  }

  groups.forEach((group, index) => {
    const groupHtml = `
        <div class="telegram-group-item">
          <button type="button" class="btn btn-sm btn-outline-danger group-delete-btn" data-index="${index}">
            <i class="fas fa-times"></i>
          </button>
          <h6 class="mb-2">${group.name} 
            <span class="badge ${
              group.active ? "bg-success" : "bg-secondary"
            } ms-2">
              ${group.active ? "ใช้งาน" : "ปิดใช้งาน"}
            </span>
          </h6>
          <div class="small text-muted">Chat ID: ${group.chat_id}</div>
          <div class="mt-2">
            <button class="btn btn-sm btn-outline-primary edit-group-btn" data-index="${index}">
              <i class="fas fa-edit me-1"></i> แก้ไข
            </button>
          </div>
        </div>
      `;
    container.append(groupHtml);
  });

  // จัดการปุ่มลบกลุ่ม
  $(".group-delete-btn").on("click", function () {
    const index = $(this).data("index");
    deleteGroup(index);
  });

  // จัดการปุ่มแก้ไขกลุ่ม
  $(".edit-group-btn").on("click", function () {
    const index = $(this).data("index");
    editGroup(index);
  });
}

/**
 * ลบกลุ่ม Telegram
 * @param {number} index - ลำดับของกลุ่มที่ต้องการลบ
 */
function deleteGroup(index) {
  if (confirm("คุณต้องการลบกลุ่มนี้ใช่หรือไม่?")) {
    try {
      let groups = JSON.parse($("#telegram_groups").val() || "[]");
      groups.splice(index, 1);
      $("#telegram_groups").val(JSON.stringify(groups));
      renderTelegramGroups(groups);
      showResult("สำเร็จ", "ลบกลุ่มเรียบร้อยแล้ว", "success");
    } catch (e) {
      console.error("Error deleting group:", e);
      showResult("ข้อผิดพลาด", "ไม่สามารถลบกลุ่มได้", "danger");
    }
  }
}

/**
 * แก้ไขกลุ่ม Telegram
 * @param {number} index - ลำดับของกลุ่มที่ต้องการแก้ไข
 */
function editGroup(index) {
  try {
    const groups = JSON.parse($("#telegram_groups").val() || "[]");
    const group = groups[index];

    if (group) {
      $("#group_index").val(index);
      $("#group_name").val(group.name);
      $("#group_chat_id").val(group.chat_id);
      $("#group_active").prop("checked", group.active);
      $("#groupModalTitle").text("แก้ไขกลุ่ม Telegram");

      const modal = new bootstrap.Modal(
        document.getElementById("telegramGroupModal")
      );
      modal.show();
    }
  } catch (e) {
    console.error("Error editing group:", e);
    showResult("ข้อผิดพลาด", "ไม่สามารถแก้ไขกลุ่มได้", "danger");
  }
}

// ==== ฟังก์ชันสำหรับการทดสอบและรายการกลุ่ม ====

/**
 * อัปเดตรายการกลุ่มใน dropdown สำหรับทดสอบ Telegram
 */
function updateTestGroupDropdown() {
  const select = $("#test_notify_group");
  select.empty();

  try {
    const groups = JSON.parse($("#telegram_groups").val() || "[]");

    if (groups.length === 0) {
      select.append('<option value="">-- ไม่มีกลุ่ม --</option>');
      return;
    }

    groups.forEach((group, index) => {
      if (group.active) {
        select.append(
          `<option value="${group.chat_id}">${group.name}</option>`
        );
      }
    });

    if (select.find("option").length === 0) {
      select.append('<option value="">-- ไม่มีกลุ่มที่เปิดใช้งาน --</option>');
    }
  } catch (e) {
    console.error("Error updating test group dropdown:", e);
    select.append(
      '<option value="">-- ไม่สามารถโหลดข้อมูลกลุ่มได้ --</option>'
    );
  }
}

/**
 * อัปเดตรายการกลุ่มใน dropdown สำหรับทดสอบ Google Apps Script
 */
function updateTestGasGroupDropdown() {
  const select = $("#test_gas_group");
  select.empty();

  try {
    const groups = JSON.parse($("#telegram_groups").val() || "[]");

    if (groups.length === 0) {
      select.append('<option value="">-- ไม่มีกลุ่ม --</option>');
      return;
    }

    groups.forEach((group, index) => {
      if (group.active) {
        select.append(
          `<option value="${group.chat_id}">${group.name}</option>`
        );
      }
    });

    if (select.find("option").length === 0) {
      select.append('<option value="">-- ไม่มีกลุ่มที่เปิดใช้งาน --</option>');
    }
  } catch (e) {
    console.error("Error updating test group dropdown:", e);
    select.append(
      '<option value="">-- ไม่สามารถโหลดข้อมูลกลุ่มได้ --</option>'
    );
  }
}

/**
 * ส่งข้อความทดสอบไปยัง Telegram
 */
function sendTestNotification() {
  const token = $("#telegram_bot_token").val();
  const chatId = $("#test_notify_group").val();
  const message = $("#test_notify_message").val();

  if (!chatId) {
    showResult("ข้อผิดพลาด", "กรุณาเลือกกลุ่มที่ต้องการทดสอบ", "danger");
    return;
  }

  if (!message) {
    showResult("ข้อผิดพลาด", "กรุณากรอกข้อความทดสอบ", "danger");
    return;
  }

  // ปิด Modal ทดสอบ
  $("#testNotifyModal").modal("hide");

  // แสดงข้อความกำลังทดสอบ
  showLoadingResult("กำลังส่งข้อความ", "กรุณารอสักครู่...");

  // ส่งข้อความทดสอบ
  $.ajax({
    url: "/api/sendnotify",
    type: "POST",
    data: JSON.stringify({
      token: token,
      chat_id: chatId,
      message: message,
    }),
    contentType: "application/json",
    success: function (response) {
      hideLoadingResult();
      if (response.success) {
        showResult(
          "สำเร็จ",
          "ส่งข้อความทดสอบเรียบร้อยแล้ว กรุณาตรวจสอบที่กลุ่ม Telegram",
          "success"
        );
      } else {
        showResult(
          "ข้อผิดพลาด",
          "ไม่สามารถส่งข้อความได้: " +
            (response.error || "โปรดตรวจสอบ Token และ Chat ID"),
          "danger"
        );
      }
    },
    error: function () {
      hideLoadingResult();
      showResult("ข้อผิดพลาด", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "danger");
    },
  });
}

/**
 * ส่งข้อความทดสอบผ่าน Google Apps Script
 */
function sendTestGasMessage() {
  const gasUrl = $("#gas_web_app_url").val();
  const token = $("#telegram_bot_token").val();
  const chatId = $("#test_gas_group").val();
  const message = $("#test_gas_message").val();
  const withLocation = $("#test_gas_with_location").is(":checked");

  if (!gasUrl) {
    showResult("ข้อผิดพลาด", "กรุณากรอก Google Apps Script URL", "danger");
    return;
  }

  if (!chatId) {
    showResult("ข้อผิดพลาด", "กรุณาเลือกกลุ่มที่ต้องการทดสอบ", "danger");
    return;
  }

  if (!message) {
    showResult("ข้อผิดพลาด", "กรุณากรอกข้อความทดสอบ", "danger");
    return;
  }

  // ปิด Modal ทดสอบ
  $("#testGasModal").modal("hide");

  // เตรียมข้อมูลสำหรับทดสอบ
  const testData = {
    message: message,
    token: token,
    chatId: chatId,
    gasUrl: gasUrl, // เพิ่ม URL เข้าไปในข้อมูลที่ส่ง
  };

  // เพิ่มพิกัดถ้าเลือกทดสอบพร้อมแผนที่
  if (withLocation) {
    testData.lat = "13.7563"; // พิกัดกรุงเทพฯ
    testData.lon = "100.5018"; // พิกัดกรุงเทพฯ
  }

  // แสดงข้อความกำลังทดสอบ
  showLoadingResult("กำลังทดสอบ", "กำลังส่งข้อความทดสอบ กรุณารอสักครู่...");

  // ส่งข้อความทดสอบผ่าน API
  $.ajax({
    url: "/api/admin/test-gas",
    type: "POST",
    data: JSON.stringify(testData),
    contentType: "application/json",
    success: function (response) {
      hideLoadingResult();
      if (response.success) {
        showResult(
          "สำเร็จ",
          "ส่งข้อความทดสอบเรียบร้อยแล้ว กรุณาตรวจสอบที่กลุ่ม Telegram",
          "success"
        );
      } else {
        showResult(
          "ข้อผิดพลาด",
          "ไม่สามารถส่งข้อความได้: " +
            (response.message || "โปรดตรวจสอบ URL, Token และ Chat ID"),
          "danger"
        );
      }
    },
    error: function () {
      hideLoadingResult();
      showResult("ข้อผิดพลาด", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "danger");
    },
  });
}

// ==== ฟังก์ชันหลักสำหรับการตั้งค่า ====

/**
 * โหลดการตั้งค่าทั้งหมด
 */
function loadSettings() {
  $.ajax({
    url: "/api/admin/settings",
    type: "GET",
    success: function (response) {
      if (response.success) {
        // แปลงข้อมูลเป็นรูปแบบ key-value
        const settings = {};
        response.settings.forEach((setting) => {
          settings[setting.setting_name] = setting.setting_value;
        });

        // กำหนดค่าให้กับฟอร์ม
        $("#organization_name").val(settings.organization_name || "");
        $("#work_start_time").val(settings.work_start_time || "08:30");
        $("#work_end_time").val(settings.work_end_time || "16:30");
        $("#allowed_ip").val(settings.allowed_ip || "");
        $("#time_offset").val(settings.time_offset || "0");

        $("#telegram_bot_token").val(settings.telegram_bot_token || "");
        $("#liff_id").val(settings.liff_id || "");

        // กำหนดค่า Google Apps Script
        $("#gas_web_app_url").val(settings.gas_web_app_url || "");
        $("#use_gas_for_telegram").prop(
          "checked",
          settings.use_gas_for_telegram !== "0"
        );

        // สร้าง input hidden สำหรับเก็บข้อมูลกลุ่ม Telegram
        if (!$("#telegram_groups").length) {
          $("#telegram-groups-container").before(
            '<input type="hidden" id="telegram_groups" name="telegram_groups">'
          );
        }

        // ตั้งค่าและแสดงรายการกลุ่ม Telegram
        try {
          const groups = settings.telegram_groups
            ? JSON.parse(settings.telegram_groups)
            : [];
          $("#telegram_groups").val(settings.telegram_groups || "[]");
          renderTelegramGroups(groups);
        } catch (e) {
          console.error("Error parsing telegram groups:", e);
          $("#telegram_groups").val("[]");
          renderTelegramGroups([]);
        }

        $("#notify_clock_in").prop("checked", settings.notify_clock_in === "1");
        $("#notify_clock_out").prop(
          "checked",
          settings.notify_clock_out === "1"
        );

        $("#admin_username").val(settings.admin_username || "");
        // ไม่โหลดรหัสผ่านเพื่อความปลอดภัย
      } else {
        showResult(
          "ข้อผิดพลาด",
          "ไม่สามารถโหลดการตั้งค่าได้: " + response.message,
          "danger"
        );
      }
    },
    error: function () {
      showResult("ข้อผิดพลาด", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "danger");
    },
  });
}

/**
 * บันทึกการตั้งค่าทั้งหมด
 */
function saveAllSettings() {
  // ตรวจสอบรหัสผ่าน (ถ้ามีการกรอก)
  const password = $("#admin_password").val();
  const confirmPassword = $("#confirm_password").val();

  if (password && password !== confirmPassword) {
    showResult(
      "ข้อผิดพลาด",
      "รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง",
      "danger"
    );
    return;
  }

  // รวบรวมการตั้งค่าทั้งหมด
  const settings = [
    { name: "organization_name", value: $("#organization_name").val() },
    { name: "work_start_time", value: $("#work_start_time").val() },
    { name: "work_end_time", value: $("#work_end_time").val() },
    { name: "allowed_ip", value: $("#allowed_ip").val() },
    { name: "time_offset", value: $("#time_offset").val() },

    { name: "telegram_bot_token", value: $("#telegram_bot_token").val() },
    { name: "telegram_groups", value: $("#telegram_groups").val() },
    {
      name: "notify_clock_in",
      value: $("#notify_clock_in").is(":checked") ? "1" : "0",
    },
    {
      name: "notify_clock_out",
      value: $("#notify_clock_out").is(":checked") ? "1" : "0",
    },

    { name: "admin_username", value: $("#admin_username").val() },
    { name: "liff_id", value: $("#liff_id").val() },

    // เพิ่มการตั้งค่า Google Apps Script
    { name: "gas_web_app_url", value: $("#gas_web_app_url").val() },
    {
      name: "use_gas_for_telegram",
      value: $("#use_gas_for_telegram").is(":checked") ? "1" : "0",
    },
  ];

  // เพิ่มรหัสผ่านเฉพาะเมื่อมีการกรอก
  if (password) {
    settings.push({ name: "admin_password", value: password });
  }

  // แสดงข้อความกำลังบันทึก
  showLoadingResult("กำลังบันทึก", "กำลังบันทึกการตั้งค่า กรุณารอสักครู่...");

  // บันทึกการตั้งค่า
  $.ajax({
    url: "/api/admin/settings",
    type: "POST",
    data: JSON.stringify({ settings }),
    contentType: "application/json",
    success: function (response) {
      hideLoadingResult();
      if (response.success) {
        // ล้างฟอร์มรหัสผ่าน
        $("#admin_password").val("");
        $("#confirm_password").val("");

        showResult("สำเร็จ", "บันทึกการตั้งค่าเรียบร้อยแล้ว", "success");
      } else {
        showResult(
          "ข้อผิดพลาด",
          "ไม่สามารถบันทึกการตั้งค่าได้: " + response.message,
          "danger"
        );
      }
    },
    error: function () {
      hideLoadingResult();
      showResult("ข้อผิดพลาด", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "danger");
    },
  });
}

/**
 * โหลดสถานะระบบ
 */
function loadSystemStatus() {
  // วันที่ติดตั้ง (สมมติ)
  const installDate = new Date();
  installDate.setMonth(installDate.getMonth() - 2); // สมมติว่าติดตั้งเมื่อ 2 เดือนที่แล้ว
  $("#installDate").text(installDate.toLocaleDateString("th-TH"));

  // ดึงจำนวนพนักงาน
  $.ajax({
    url: "/api/admin/employees",
    type: "GET",
    success: function (response) {
      if (response.success) {
        $("#employeeCount").text(response.employees.length);
      } else {
        $("#employeeCount").text("0");
      }
    },
    error: function () {
      $("#employeeCount").text("0");
    },
  });

  // ดึงจำนวนบันทึกเวลา
  $.ajax({
    url: "/api/admin/time-logs",
    type: "GET",
    success: function (response) {
      if (response.success && response.logs) {
        $("#logCount").text(response.logs.length);
      } else {
        $("#logCount").text("0");
      }
    },
    error: function () {
      $("#logCount").text("0");
    },
  });
}

// ==== ฟังก์ชันสำหรับการแสดงผล ====

/**
 * แสดงผลลัพธ์
 * @param {string} title - หัวข้อ
 * @param {string} message - ข้อความ
 * @param {string} type - ประเภท (success, danger, warning, info)
 */
function showResult(title, message, type) {
  $("#resultModalTitle").text(title);
  $("#resultModalBody").html(
    `<div class="alert alert-${type} mb-0">${message}</div>`
  );

  const modal = new bootstrap.Modal(document.getElementById("resultModal"));
  modal.show();
}

/**
 * แสดงผลลัพธ์แบบกำลังโหลด
 * @param {string} title - หัวข้อ
 * @param {string} message - ข้อความ
 */
function showLoadingResult(title, message) {
  $("#resultModalTitle").text(title);
  $("#resultModalBody").html(
    `<div class="alert alert-info mb-0">${message}</div>`
  );

  window.resultModal = new bootstrap.Modal(
    document.getElementById("resultModal")
  );
  window.resultModal.show();
}

/**
 * ซ่อนผลลัพธ์แบบกำลังโหลด
 */
function hideLoadingResult() {
  if (window.resultModal) {
    window.resultModal.hide();
    window.resultModal = null;
  }
}
