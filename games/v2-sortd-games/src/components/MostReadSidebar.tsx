import React from "react";
import { useTranslation } from "react-i18next";

interface MostReadItem {
  id: string;
  thumbnail: string;
  category: string;
  headline: string;
  link?: string;
}

interface MostReadSidebarProps {
  items?: MostReadItem[];
}

const MostReadSidebar: React.FC<MostReadSidebarProps> = ({ items = [] }) => {
  const { t } = useTranslation();

  // Mock data for now - can be replaced with API call
  const defaultItems: MostReadItem[] = items.length > 0 ? items : [
    {
      id: "1",
      thumbnail: "https://images.unsplash.com/photo-1585241645927-c7a8e5840c42?w=150&h=100&fit=crop",
      category: "سياسة",
      headline: "عنوان المقال الأول الذي يظهر في قائمة الأكثر قراءة",
    },
    {
      id: "2",
      thumbnail: "https://images.unsplash.com/photo-1585241645927-c7a8e5840c42?w=150&h=100&fit=crop",
      category: "حول العالم",
      headline: "عنوان المقال الثاني في قائمة الأكثر قراءة",
    },
    {
      id: "3",
      thumbnail: "https://images.unsplash.com/photo-1585241645927-c7a8e5840c42?w=150&h=100&fit=crop",
      category: "فن",
      headline: "عنوان المقال الثالث في قائمة الأكثر قراءة",
    },
    {
      id: "4",
      thumbnail: "https://images.unsplash.com/photo-1585241645927-c7a8e5840c42?w=150&h=100&fit=crop",
      category: "تكنولوجيا",
      headline: "عنوان المقال الرابع في قائمة الأكثر قراءة",
    },
    {
      id: "5",
      thumbnail: "https://images.unsplash.com/photo-1585241645927-c7a8e5840c42?w=150&h=100&fit=crop",
      category: "صحة",
      headline: "عنوان المقال الخامس في قائمة الأكثر قراءة",
    },
  ];

  return (
    <div className="w-full">
    {/* <div className="bg-[#F4F4F4] p-4"> */}
      {/* Title with red accent bar */}
      {/* <div className="flex items-center gap-3 mb-2">
        <div className="w-1.5 h-8 red-divider"></div>
        <h2 className="text-[30px] font-black text-black dark:text-white">
          {t("common.mostRead")}
        </h2>
      </div> */}

      {/* Most Read Items List */}
      {/* <div className="space-y-4 bg-white p-2 pt-0 pb-4 divide-y divide-[#E8E8E8]"> */}
        {false && defaultItems.map((item, index) => (
          <div
            key={item.id}
            className="flex gap-3 cursor-pointer hover:opacity-80 transition-opacity pt-4"
            onClick={() => {
              if (item.link) {
                window.open(item.link, "_blank");
              }
            }}
          >
            {/* Thumbnail */}
            <div className="flex-shrink-0 w-20 h-16 rounded overflow-hidden">
              <img
                src={item.thumbnail}
                alt={item.headline}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.unsplash.com/photo-1585241645927-c7a8e5840c42?w=150&h=100&fit=crop";
                }}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 font-black">
              {/* Category */}
              <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                {item.category}
              </span>
              {/* Headline */}
              <h3 className="text-sm text-gray-900 dark:text-white line-clamp-2">
                {item.headline}
              </h3>
            </div>
          </div>
        ))}
      {/* </div> */}

    {/* </div> */}
      {/* Advertisement placeholder - can be replaced with actual ad component */}
      <div className="mt-8 p-4 m-4 bg-[#F4F4F4]">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Advertisement
        </div>
      </div>
    </div>
  );
};

export default MostReadSidebar;

