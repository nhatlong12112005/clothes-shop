const products = [
  // --- DANH MỤC ÁO (categoryId: 1) ---
  {
    id: 1,
    name: "Áo thun Basic Cotton",
    image:
      "data:image/jpeg;base64,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",
    categoryId: 1, // Liên kết với ID=1 (Áo) bên file category
    subCategory: "Áo Thun", // Khớp với text trong mảng subCategories
    isNew: true,
    sold: 1200,
    description:
      "Chất liệu Cotton 100% thấm hút mồ hôi cực tốt, mềm mịn và thoáng mát. Form dáng basic dễ phối đồ.",
    variants: [
      {
        color: "Trắng",
        sizes: [{ size: "L", price: 199000, quantity: 10 }],
      },
    ],
  },
  {
    id: 2,
    name: "Áo Hoodie Form Rộng",
    image:
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lmuko27zzwmpfa",
    categoryId: 1, // Vẫn là Áo
    subCategory: "Áo Khoác / Hoodie",
    isNew: true,
    sold: 85,
    description:
      "Thiết kế form rộng chuẩn style Hàn Quốc, chất nỉ bông dày dặn, giữ ấm tốt.",
    variants: [
      {
        color: "Xám",
        sizes: [{ size: "M", price: 499000, quantity: 5 }],
      },
    ],
  },
  {
    id: 5,
    name: "Áo Khoác Bomber",
    image: "../image/bomber.jpg",
    categoryId: 1, // Vẫn là Áo
    subCategory: "Áo Khoác / Hoodie",
    isNew: false,
    sold: 2100,
    description: "Phong cách Streetwear bụi bặm, chất dù 2 lớp chống nước nhẹ.",
    variants: [
      {
        color: "Đen",
        sizes: [{ size: "XL", price: 650000, quantity: 10 }],
      },
    ],
  },

  // --- DANH MỤC QUẦN (categoryId: 2) ---
  {
    id: 3,
    name: "Quần Jean Ống Suông",
    image:
      "https://down-vn.img.susercontent.com/file/cn-11134207-7r98o-lqwafc6y5n9p2f",
    categoryId: 2, // Liên kết với ID=2 (Quần)
    subCategory: "Quần Jean",
    isNew: false,
    sold: 5400,
    description:
      "Quần Jean hack dáng thần thánh, chất vải denim cao cấp không co giãn giữ form cực chuẩn.",
    variants: [
      {
        color: "Xanh",
        sizes: [{ size: "30", price: 350000, quantity: 20 }],
      },
    ],
  },

  // --- DANH MỤC PHỤ KIỆN (categoryId: 4) ---
  {
    id: 4,
    name: "Mũ Lưỡi Trai Unisex",
    image:
      "https://down-vn.img.susercontent.com/file/vn-11134207-7qukw-ljj7g5j5p5j50e",
    categoryId: 4, // Liên kết với ID=4 (Phụ kiện)
    subCategory: "Mũ / Nón",
    isNew: true,
    sold: 450,
    description:
      "Phụ kiện không thể thiếu cho set đồ năng động. Chất vải Kaki bền màu.",
    variants: [
      {
        color: "Đen",
        sizes: [{ size: "F", price: 99000, quantity: 100 }],
      },
    ],
  },
];
