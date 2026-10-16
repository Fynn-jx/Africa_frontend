// Canonical methodology copy only. The frontend keeps its demo scores and does
// not compute country pressure, category contributions or reference extrema.
export const PORI_DEFINITION = "PORI（Public Opinion Risk Index，舆情风险指数）衡量国家 c 在时间 t 的舆情风险：将累积压力 P_{c,t} 经 ln(1+P) 对数变换后，按参考范围进行 min-max 归一化，映射到0–100分。";
export const PORI_FORMULA = "PORI_{c,t} = 100 × (ln(1+P_{c,t}) - min_ref ln(1+P)) / (max_ref ln(1+P) - min_ref ln(1+P))";
export const PORI_GRID_FORMULA = "R_{g,t} = Σ_{e∈E_t} s_e × k_τ(e) × exp(-c(e,g)/λ_τ(e))";
export const PORI_AGGREGATION_NOTE = "P_{c,t} 由国家 c 在时间 t 的有效网格压力 R_{g,t} 按约定的区域/时间口径聚合得到；有效网格、统计窗口和聚合算子由正式数据管线明确。";
export const PORI_PARAMETER_NOTE = "τ(e) 表示事件类别，s_e 为事件强度，k_τ 为类别贡献系数，λ_τ 为类别衰减参数，c(e,g) 为事件到网格的最小累计成本距离。";
export const PORI_NORMALIZATION_NOTE = "ln(1+P) 只做对数压缩，结果本身不是0–100分。min_ref 与 max_ref 是同一参考样本范围内 ln(1+P) 的最小值和最大值；参考范围、更新规则及分母为零或超出参考范围时的处理需由正式数据管线定义。";
export const PORI_EXAMPLE_NOTE = "计算顺序示例：假设一个国家只有一个有效网格，L、M 两类事件在该窗口内的总贡献分别为2和8，则 P=2+8=10，ln(1+P)=ln(11)≈2.398。若参考压力范围假设为0–100，PORI=100×ln(11)/ln(101)≈52.0分。该参考范围仅用于算例；2、8及 ln(11) 均不是最终PORI分数。";
export const PORI_DIMENSION_NOTE = "三大类与15项子维度用于分类风险贡献展示和结构解释；正式分类贡献应按相应类别的事件贡献汇总。PORI总分由总压力经 ln(1+P) 和 min-max 生成，不取三大类或子维度分数的算术平均。";
export const PORI_DEMO_NOTE = "当前总分、分类贡献、子维度及趋势均为演示数据，尚未接入全量压力聚合、类别参数校准与正式参考范围归一化计算。";
export const PORI_METHODOLOGY = `${PORI_DEFINITION} ${PORI_FORMULA}。${PORI_NORMALIZATION_NOTE}`;
