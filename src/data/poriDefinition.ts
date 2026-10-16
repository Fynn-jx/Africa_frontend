// Canonical methodology copy only. The frontend keeps its demo scores and does
// not compute country pressure, category contributions or reference extrema.
export const PORI_DEFINITION = "舆情风险情绪指数（PORI，Public Opinion Risk Index）是网格层地缘政治风险压力指数在国家层的聚合：先取国家 c 全部网格在第 t 周压力水平的均值 P，再取 ln(1+P)，并以历史窗口内各国各周 ln(1+P) 的最小值与最大值归一到 0—100（超出部分截断），即 PORI = 100 ×（ln(1+P) − 历史最小值）÷（历史最大值 − 历史最小值）。PORI 与项目周边预警所用的网格层压力水平、升级信号出自同一模型，仅空间尺度不同。";
export const PORI_WARNING_NOTE = "项目周边使用网格层压力水平 L 与升级信号 M（近2周均值相对前8周基线的变化率）进行预警。";
export const PORI_FORMULA = "PORI_{c,t} = 100 × (ln(1+P_{c,t}) - min_ref ln(1+P)) / (max_ref ln(1+P) - min_ref ln(1+P))";
export const PORI_GRID_FORMULA = "R_{g,t} = Σ_{e∈E_t} s_e × k_τ(e) × exp(-c(e,g)/λ_τ(e))";
export const PORI_AGGREGATION_NOTE = "P_{c,t} 是国家 c 全部网格在第 t 周压力水平 R_{g,t} 的均值。";
export const PORI_PARAMETER_NOTE = "τ(e) 表示事件类别，s_e 为事件强度，k_τ 为事件类别 τ 的类别权重，λ_τ 为类别衰减参数，c(e,g) 为事件到网格的最小累计成本距离。";
export const PORI_NORMALIZATION_NOTE = "ln(1+P) 只做对数压缩，结果本身不是0–100分。min_ref 与 max_ref 是历史窗口内各国各周 ln(1+P) 的最小值和最大值；归一化后超出0–100的部分截断，历史窗口、更新规则及分母为零时的处理由正式数据管线定义。";
export const PORI_DIMENSION_NOTE = "三大类与15项子维度为各类别对网格压力的贡献分解（演示数据），用于风险解释，不参与 PORI 合成。";
export const PORI_DEMO_NOTE = "当前总分、分类贡献、子维度及趋势均为演示数据，尚未接入全量压力聚合、类别参数校准与正式参考范围归一化计算。";
export const PORI_METHODOLOGY = `${PORI_DEFINITION} ${PORI_WARNING_NOTE} ${PORI_FORMULA}。${PORI_NORMALIZATION_NOTE}`;
