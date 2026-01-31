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
    <div className="readmore-article-widget-wrapper">
      <a
        href={addUtmParams(article_detail?.link || "")}
        target="_blank"
        rel="noopener noreferrer"
        className="flex mb-4 items-start mt-1 md:mt-4 gap-2 md:gap-4 p-1 md:p-4 dark:from-blue-950/30 dark:to-purple-950/30"
      >
        <div className="w-[60px] md:w-[188px] h-[40px] md:h-[119px] flex items-center justify-center relative">
          <img src={ExternalLinkIconImage} alt="Link" className={`w-[16px] md:w-[32px] h-[16px] md:h-[32px] object-cover cursor-pointer absolute top-[-8px] md:top-[-16px] ${ isArabic ? "right-[-8px] md:right-[-16px]" : "left-[-8px] md:left-[-16px] -rotate-90" }`} />
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

        <div className={`flex-1 text-foreground ${isArabic ? "text-right" : "text-left"}`}>
          <h3 className="font-bold text-[12px] md:text-[18px] leading-[20px] md:leading-[40px]">
            {article_detail?.title}
          </h3>
          <p className="font-bold text-[12px] md:text-[18px] leading-[20px] md:leading-[40px] cursor-pointer hover:underline">
            {t("common.readMoreAboutArticle")}
          </p>
        </div>
      </a>
    </div>
  );
};

export default ReadmoreArticleWidget;