# Agenda 文稿汇总报告

## 任务信息
- Meeting List：TDoc_List_Meeting_SA2#174
- Agenda Item：7.1
- 总文稿数：1
- 成功完成：1
- 失败数量：0

## 逐篇摘要

### 1. LS from RAN WG3: LS on prioritized AQP list
- TDoc ID：S2-2601751
- 状态：done

该文稿旨在解决5G RAN WG3规范中缺失的QoS参数优先级信息问题。在SA2和CT4已定义的替代QoS配置列表（AQP list）中，RAN3确认其在RAN3规范中的Alternative QoS Parameters Set List IE中未包含优先级字段，导致无法实现QoS参数的优先级处理。为此，RAN3通过提交CRs（变更请求）在Rel-16版本中补充了该优先级信息，明确要求在PDU会话资源建立、修改及通知等关键流程中，当存在替代QoS参数集时，NG-RAN节点需根据优先级判断是否接受配置，并在响应中明确指示当前实际满足的替代QoS参数集索引。该变更增强了网络对QoS参数灵活性和优先级管理的能力，有助于提升5G-V2X场景下对关键业务（如延迟敏感业务）的保障能力，对终端与核心网间的QoS协商一致性具有重要影响。
