import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, Check, ChevronDown, ChevronUp, Search, Filter, Calendar, MapPin, Tag, FileText, Shield, AlertCircle } from "lucide-react";
import { allKnowledgeBase, recommendKnowledge, KnowledgeItem, filterKnowledgeByType } from "../data/knowledgeBase";

interface KnowledgeBaseSelectorProps {
  eventType: string;
  country: string;
  selectedItems: KnowledgeItem[];
  onSelectionChange: (items: KnowledgeItem[]) => void;
}

export default function KnowledgeBaseSelector({
  eventType,
  country,
  selectedItems,
  onSelectionChange,
}: KnowledgeBaseSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("全部");

  // 获取推荐的知识库条目
  const recommendedItems = recommendKnowledge(eventType, country);

  // 过滤知识库
  const filteredItems = allKnowledgeBase.filter((item) => {
    const matchesSearch =
      searchTerm === "" ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType =
      filterType === "全部" || item.type === filterType;

    return matchesSearch && matchesType;
  });

  // 切换选择
  const toggleItem = (item: KnowledgeItem) => {
    const isSelected = selectedItems.some((selected) => selected.id === item.id);
    if (isSelected) {
      onSelectionChange(selectedItems.filter((selected) => selected.id !== item.id));
    } else {
      onSelectionChange([...selectedItems, item]);
    }
  };

  // 全选/取消全选
  const toggleAll = () => {
    if (selectedItems.length === filteredItems.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredItems);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* 标题栏 */}
      <div className="p-4 bg-gradient-to-r from-[#005BBB] to-[#004090] text-white cursor-pointer"
           onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5" />
            <div>
              <h3 className="font-semibold text-base">知识库参考</h3>
              <p className="text-xs opacity-90 mt-0.5">
                {selectedItems.length > 0
                  ? `已选择 ${selectedItems.length} 个知识条目`
                  : `推荐 ${recommendedItems.length} 个相关知识`
                }
              </p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </div>
      </div>

      {/* 展开内容 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* 搜索和过滤 */}
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索知识库..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005BBB] focus:border-transparent"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005BBB]"
                >
                  <option value="全部">全部</option>
                  <option value="annotation">标注</option>
                  <option value="impact">影响</option>
                  <option value="policy">政策</option>
                </select>
              </div>

              {/* 推荐标签 */}
              {recommendedItems.length > 0 && searchTerm === "" && filterType === "全部" && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                  <BookOpen className="w-4 h-4 text-[#005BBB]" />
                  <span className="text-xs text-[#005BBB] font-medium">
                    基于当前事件推荐 {recommendedItems.length} 个相关知识
                  </span>
                </div>
              )}

              {/* 全选按钮 */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  共 {filteredItems.length} 个知识条目
                </span>
                <button
                  onClick={toggleAll}
                  className="text-xs text-[#005BBB] hover:underline font-medium"
                >
                  {selectedItems.length === filteredItems.length ? "取消全选" : "全选"}
                </button>
              </div>

              {/* 知识库列表 */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    未找到相关知识库条目
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const isSelected = selectedItems.some((selected) => selected.id === item.id);
                    const isRecommended = recommendedItems.some((rec) => rec.id === item.id);

                    return (
                      <motion.button
                        key={item.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => toggleItem(item)}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? "border-[#005BBB] bg-blue-50"
                            : "border-gray-200 hover:border-[#005BBB]/50 bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* 选择框 */}
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isSelected
                              ? "border-[#005BBB] bg-[#005BBB]"
                              : "border-gray-300"
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>

                          {/* 内容 */}
                          <div className="flex-1 min-w-0">
                            {/* 标题和标签 */}
                            <div className="flex items-start gap-2 mb-2">
                              <h4 className="text-sm font-semibold text-gray-900 line-clamp-1 flex-1">
                                {item.title}
                              </h4>
                              {isRecommended && (
                                <span className="px-2 py-0.5 bg-[#005BBB] text-white text-xs rounded-full flex-shrink-0">
                                  推荐
                                </span>
                              )}
                            </div>

                            {/* 分类 */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs text-gray-500">{item.category}</span>
                            </div>

                            {/* 内容摘要 */}
                            <p className="text-xs text-gray-600 mb-2 line-clamp-3">
                              {item.content}
                            </p>

                            {/* 标签 */}
                            <div className="flex items-center gap-1 flex-wrap">
                              {item.tags.slice(0, 3).map((tag, index) => (
                                <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                  {tag}
                                </span>
                              ))}
                              {item.tags.length > 3 && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                  +{item.tags.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
