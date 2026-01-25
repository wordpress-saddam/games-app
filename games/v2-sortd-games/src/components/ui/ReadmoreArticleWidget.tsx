import React from 'react';
import { addUtmParams } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import ExternalLinkIconImage from "../../assets/link-icon.png";

interface ReadmoreArticleWidgetProps {
    article_detail: {
    title: string;
    link: string;
    image_url: string;
  };  
}

const ReadmoreArticleWidget: React.FC<ReadmoreArticleWidgetProps> = ({ article_detail }) => {

  const { t } = useTranslation();

  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  return (
    <div className="hidden md:block py-0 px-6">
      <a
        href={addUtmParams(article_detail?.link || "")}
        target="_blank"
        rel="noopener noreferrer"
        className="flex mb-4 items-start mt-4 gap-4 p-4 dark:from-blue-950/30 dark:to-purple-950/30"
      >
        <div className="w-[188px] h-[119px] flex items-center justify-center relative">
          <img src={ExternalLinkIconImage} alt="Link" className="w-[32px] h-[32px] object-cover rounded-[8px] absolute top-[-16px] right-[-16px] cursor-pointer" />
          <img
            src={article_detail?.image_url}
            alt={article_detail?.title}
            className="w-full h-full object-cover rounded-[8px]"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                "https://idea410.digital.uic.edu/wp-content/themes/koji/assets/images/default-fallback-image.png";
            }}
          />
        </div>

        <div className={`flex-1 ${isArabic ? "text-right" : "text-left"}`}>
          <h3 className="font-bold text-[18px] leading-[40px] text-black">
            {article_detail?.title}
          </h3>
          <p className="font-bold text-[18px] leading-[40px] text-black cursor-pointer hover:underline">
            {t("common.readMoreAboutArticle")}
          </p>
        </div>
      </a>
    </div>
  );
};

export default ReadmoreArticleWidget;