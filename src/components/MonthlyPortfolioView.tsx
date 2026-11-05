"use client";

/**
 * Aura Golden 월별 주식계좌 자산 관리 컴포넌트 (MonthlyPortfolioView.tsx)
 * 
 * [피드백 및 제로 데이터 정책 반영]
 * 1. 각 행의 줄(border) 엇갈림 해결: border-collapse와 균일 행 높이로 깔끔한 수평 라인 보장
 * 2. 인라인 직접 수정: 수량, 매입단가, 현재가, 배당금 셀 클릭 시 엑셀처럼 즉시 수정 및 실시간 자동 계산
 * 3. 계좌 추가 기능: [+ 새 계좌 추가] 모달을 통해 새로운 금융 계좌 자유롭게 등록
 * 4. 빈 상태(Empty State) 지원: 종목이 없을 때도 에러 없이 깔끔한 안내 제공
 * 5. 모든 표 상단 컬럼명 가운데 정렬(text-center) 통일
 */

import React, { useState } from "react";
import {
  Calendar,
  PlusCircle,
  Copy,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  PiggyBank,
  Edit2,
  Trash2,
  Check,
  X,
  Layers,
  FolderPlus,
} from "lucide-react";
import { MonthlyRecord, StockItem } from "@/types";
import { formatKRW, formatPercent } from "@/lib/calculations";
import {
  upsertStockItem,
  deleteStockItem,
  updateMonthlyRealizedGain,
  copyPortfolioFromPreviousMonth,
  updateStockItemField,
  getCustomAccounts,
  addCustomAccount,
} from "@/lib/dataStore";

interface MonthlyPortfolioViewProps {
  records: MonthlyRecord[];
  currentRecord: MonthlyRecord;
  onSelectYearMonth: (ym: string) => void;
  onRefresh: () => void;
}

export const MonthlyPortfolioView: React.FC<MonthlyPortfolioViewProps> = ({
  records,
  currentRecord,
  onSelectYearMonth,
  onRefresh,
}) => {
  // 계좌 목록 상태
  const [accountList, setAccountList] = useState<string[]>(() => getCustomAccounts());
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [newAccountInput, setNewAccountInput] = useState("");

  // 종목 추가/수정 모달 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  // 신규 월 생성 모달 상태
  const [isNewMonthModalOpen, setIsNewMonthModalOpen] = useState(false);
  const [newYearMonthInput, setNewYearMonthInput] = useState("");
  const [copyFromMonth, setCopyFromMonth] = useState(currentRecord ? currentRecord.yearMonth : "");

  // 표 내 숫자 인라인 직접 편집 상태
  const [inlineEditing, setInlineEditing] = useState<{
    itemId: string;
    field: "quantity" | "avgBuyPrice" | "currentPrice" | "dividendOrProfit";
    value: string;
  } | null>(null);

  // 매도손익 인라인 수정 상태
  const [isEditingRealizedGain, setIsEditingRealizedGain] = useState(false);
  const [realizedGainInput, setRealizedGainInput] = useState(
    currentRecord ? currentRecord.realizedGain.toString() : "0"
  );

  // 종목 추가/수정 폼 필드
  const [formAccountName, setFormAccountName] = useState(accountList[0] || "일반계좌");
  const [formStockName, setFormStockName] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [formAvgBuyPrice, setFormAvgBuyPrice] = useState("");
  const [formCurrentPrice, setFormCurrentPrice] = useState("");
  const [formDividend, setFormDividend] = useState("0");

  // 계좌별로 아이템 그룹핑
  const accountGroups = React.useMemo(() => {
    if (!currentRecord || !currentRecord.items) return [];
    const map = new Map<string, StockItem[]>();
    for (const item of currentRecord.items) {
      const list = map.get(item.accountName) || [];
      list.push(item);
      map.set(item.accountName, list);
    }
    return Array.from(map.entries()).map(([accountName, items]) => ({
      accountName,
      items,
      subtotalBuyAmount: items.reduce((sum, i) => sum + i.buyAmount, 0),
      subtotalEvaluatedAmount: items.reduce((sum, i) => sum + i.evaluatedAmount, 0),
      subtotalDividend: items.reduce((sum, i) => sum + i.dividendOrProfit, 0),
      subtotalEvaluatedProfit: items.reduce((sum, i) => sum + i.evaluatedProfit, 0),
    }));
  }, [currentRecord]);

  // 인라인 편집 시작
  const handleStartInlineEdit = (
    itemId: string,
    field: "quantity" | "avgBuyPrice" | "currentPrice" | "dividendOrProfit",
    currentVal: number
  ) => {
    setInlineEditing({
      itemId,
      field,
      value: currentVal > 0 ? currentVal.toString() : "0",
    });
  };

  // 인라인 편집 저장
  const handleSaveInlineEdit = () => {
    if (!inlineEditing || !currentRecord) return;
    const num = parseFloat(inlineEditing.value) || 0;
    updateStockItemField(currentRecord.yearMonth, inlineEditing.itemId, inlineEditing.field, num);
    setInlineEditing(null);
    onRefresh();
  };

  const handleInlineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveInlineEdit();
    } else if (e.key === "Escape") {
      setInlineEditing(null);
    }
  };

  // 계좌 추가 처리
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountInput.trim()) return;
    const updated = addCustomAccount(newAccountInput.trim());
    setAccountList(updated);
    setFormAccountName(newAccountInput.trim());
    setNewAccountInput("");
    setIsAddAccountModalOpen(false);
  };

  // 편집 모달 열기
  const handleOpenEdit = (item: StockItem) => {
    setEditingItem(item);
    setFormAccountName(item.accountName);
    setFormStockName(item.stockName);
    setFormQuantity(item.quantity.toString());
    setFormAvgBuyPrice(item.avgBuyPrice.toString());
    setFormCurrentPrice(item.currentPrice.toString());
    setFormDividend(item.dividendOrProfit.toString());
    setIsAddModalOpen(true);
  };

  // 신규 추가 모달 열기
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormAccountName(accountList[0] || "일반계좌");
    setFormStockName("");
    setFormQuantity("");
    setFormAvgBuyPrice("");
    setFormCurrentPrice("");
    setFormDividend("0");
    setIsAddModalOpen(true);
  };

  // 종목 저장
  const handleSaveStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRecord) return;
    const qty = parseFloat(formQuantity) || 0;
    const buyPrice = parseFloat(formAvgBuyPrice) || 0;
    const curPrice = parseFloat(formCurrentPrice) || 0;
    const div = parseFloat(formDividend) || 0;

    if (!formStockName.trim()) {
      alert("종목명을 입력해주세요.");
      return;
    }

    upsertStockItem(currentRecord.yearMonth, {
      id: editingItem ? editingItem.id : undefined,
      accountName: formAccountName,
      stockName: formStockName.trim(),
      quantity: qty,
      avgBuyPrice: buyPrice,
      currentPrice: curPrice,
      dividendOrProfit: div,
    });

    setIsAddModalOpen(false);
    onRefresh();
  };

  // 종목 삭제
  const handleDeleteStock = (itemId: string, stockName: string) => {
    if (!currentRecord) return;
    if (confirm(`'${stockName}' 종목을 정말 삭제하시겠습니까?`)) {
      deleteStockItem(currentRecord.yearMonth, itemId);
      onRefresh();
    }
  };

  // 매도손익 저장
  const handleSaveRealizedGain = () => {
    if (!currentRecord) return;
    const val = parseFloat(realizedGainInput) || 0;
    updateMonthlyRealizedGain(currentRecord.yearMonth, val);
    setIsEditingRealizedGain(false);
    onRefresh();
  };

  // 신규 연월 생성 및 이전달 복사
  const handleCreateNewMonth = (e: React.FormEvent) => {
    e.preventDefault();
    const targetYM = newYearMonthInput.trim();
    if (!/^\d{4}\.\d{2}$/.test(targetYM)) {
      alert("연월 형식은 'YYYY.MM' (예: 2026.11) 형태로 입력해주세요.");
      return;
    }

    try {
      if (copyFromMonth) {
        copyPortfolioFromPreviousMonth(copyFromMonth, targetYM);
      }
      setIsNewMonthModalOpen(false);
      onSelectYearMonth(targetYM);
      onRefresh();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. 상단 컨트롤 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-aura-card border border-aura-border rounded-2xl shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-aura-muted uppercase tracking-wider block">
              기준 연월 선택
            </label>
            <div className="flex items-center space-x-2 mt-0.5">
              <select
                value={currentRecord.yearMonth}
                onChange={(e) => onSelectYearMonth(e.target.value)}
                className="bg-aura-bg border border-aura-border text-amber-300 font-bold text-lg rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {records.map((r) => (
                  <option key={r.yearMonth} value={r.yearMonth} className="bg-aura-card text-white">
                    {r.yearMonth} 정산
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 액션 버튼 그룹 */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={() => setIsAddAccountModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-aura-bg hover:bg-aura-cardHover text-slate-200 border border-aura-border hover:border-amber-500/40 transition"
          >
            <FolderPlus className="w-4 h-4 text-amber-400" />
            <span>새 계좌 추가</span>
          </button>

          {records.length > 0 && (
            <button
              onClick={() => setIsNewMonthModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-aura-bg hover:bg-aura-cardHover text-slate-200 border border-aura-border hover:border-amber-500/40 transition"
            >
              <Copy className="w-4 h-4 text-amber-400" />
              <span>새 월 생성 (지난달 복사)</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-black shadow-md shadow-amber-500/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>종목 추가</span>
          </button>
        </div>
      </div>

      {/* 2. 핵심 금융 요약 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* 실 투입 원금 */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-yellow-600/10 to-aura-card border-2 border-amber-500/40 shadow-xl shadow-amber-500/10">
          <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
            <PiggyBank className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-amber-300 tracking-tight flex items-center space-x-1">
            <span>실 투입 원금</span>
            <span className="text-[10px] text-aura-muted font-normal">(배당/수익 제외)</span>
          </p>
          <p className="text-2xl font-black text-white mt-2 tracking-tight gold-text-gradient">
            ₩ {formatKRW(currentRecord.realInvestedCapital)}
          </p>
          <p className="text-[11px] text-aura-muted mt-1">
            총매입금 - 총배당수익
          </p>
        </div>

        {/* 총 매입금액 */}
        <div className="p-5 rounded-2xl bg-aura-card border border-aura-border shadow-lg">
          <div className="flex items-center justify-between text-aura-muted">
            <span className="text-xs font-semibold">총 매입금액</span>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-extrabold text-slate-100 mt-2">
            ₩ {formatKRW(currentRecord.totalBuyAmount)}
          </p>
          <p className="text-[11px] text-aura-muted mt-1">
            전체 보유 주식 원금 합산
          </p>
        </div>

        {/* 총 평가금액 */}
        <div className="p-5 rounded-2xl bg-aura-card border border-aura-border shadow-lg">
          <div className="flex items-center justify-between text-aura-muted">
            <span className="text-xs font-semibold">총 평가금액</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-extrabold text-slate-100 mt-2">
            ₩ {formatKRW(currentRecord.totalEvaluatedAmount)}
          </p>
          <p className="text-[11px] text-aura-muted mt-1">
            현재 시장가치 총액
          </p>
        </div>

        {/* 총 배당금/수익 */}
        <div className="p-5 rounded-2xl bg-aura-card border border-aura-border shadow-lg">
          <div className="flex items-center justify-between text-aura-muted">
            <span className="text-xs font-semibold">총 배당금/수익</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold text-emerald-400 mt-2">
            ₩ {formatKRW(currentRecord.totalDividendOrProfit)}
          </p>
          <div className="text-[11px] text-aura-muted mt-1 flex items-center justify-between">
            <span>매도손익:</span>
            <span className={currentRecord.realizedGain >= 0 ? "text-rose-400" : "text-sky-400"}>
              {formatKRW(currentRecord.realizedGain)}원
            </span>
          </div>
        </div>

        {/* 총 평가손익 & 총 수익률 */}
        <div className={`p-5 rounded-2xl bg-aura-card border shadow-lg ${
          currentRecord.totalProfit >= 0 ? "border-rose-500/30" : "border-sky-500/30"
        }`}>
          <div className="flex items-center justify-between text-aura-muted">
            <span className="text-xs font-semibold">총 평가손익 / 수익률</span>
            {currentRecord.totalProfit >= 0 ? (
              <TrendingUp className="w-4 h-4 text-rose-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-sky-400" />
            )}
          </div>
          <p className={`text-xl font-extrabold mt-2 ${
            currentRecord.totalProfit >= 0 ? "text-rose-500" : "text-sky-400"
          }`}>
            ₩ {formatKRW(currentRecord.totalProfit)}
          </p>
          <p className={`text-xs font-bold mt-1 ${
            currentRecord.totalProfitRate >= 0 ? "text-rose-400" : "text-sky-400"
          }`}>
            수익률: {formatPercent(currentRecord.totalProfitRate)}
          </p>
        </div>

      </div>

      {/* 3. 메인 포트폴리오 데이터 테이블 */}
      <div className="bg-aura-card border border-aura-border rounded-2xl shadow-xl overflow-hidden">
        
        <div className="px-6 py-4 border-b border-aura-border flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100">
              {currentRecord.yearMonth} 포트폴리오 자산 상세 내역
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-aura-bg border border-aura-border text-aura-muted">
              총 {currentRecord.items.length}개 종목
            </span>
          </div>
          <p className="text-xs text-amber-300/80 font-medium">
            💡 [수량], [매입단가], [현재가], [배당금] 셀을 클릭하면 표에서 바로 숫자를 수정할 수 있습니다.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1050px]">
            <thead>
              <tr className="bg-amber-400 text-black font-extrabold text-[12px] border-b border-amber-500">
                <th className="py-3 px-3 text-center w-24">기간</th>
                <th className="py-3 px-3 text-center w-36">계좌</th>
                <th className="py-3 px-4 text-center min-w-[160px]">종 목</th>
                <th className="py-3 px-3 text-center">수량</th>
                <th className="py-3 px-3 text-center">매입단가</th>
                <th className="py-3 px-3 text-center">현재가</th>
                <th className="py-3 px-3 text-center">매입금액</th>
                <th className="py-3 px-3 text-center">평가금액</th>
                <th className="py-3 px-3 text-center">배당금/수익</th>
                <th className="py-3 px-3 text-center">평가손익</th>
                <th className="py-3 px-3 text-center">수익률</th>
                <th className="py-3 px-3 text-center w-16">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aura-border font-medium text-slate-200">
              {currentRecord.items.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-aura-muted">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <PlusCircle className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-200">
                        {currentRecord.yearMonth}에 등록된 보유 주식 종목이 없습니다.
                      </p>
                      <p className="text-xs text-aura-muted">
                        우측 상단의 <strong className="text-amber-400">[+ 종목 추가]</strong> 버튼을 눌러 첫 종목을 직접 등록해 보세요!
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                accountGroups.map((group, groupIdx) => {
                  return (
                    <React.Fragment key={group.accountName}>
                      {group.items.map((item, itemIdx) => {
                        const isUp = item.evaluatedProfit >= 0;

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-aura-cardHover/60 transition duration-150 h-11 border-b border-aura-border"
                          >
                            {groupIdx === 0 && itemIdx === 0 ? (
                              <td
                                rowSpan={currentRecord.items.length + 1}
                                className="py-3 px-3 text-center font-bold text-amber-300 bg-aura-bg/80 border-r border-aura-border align-middle text-sm"
                              >
                                {currentRecord.yearMonth}
                              </td>
                            ) : null}

                            {itemIdx === 0 ? (
                              <td
                                rowSpan={group.items.length}
                                className="py-3 px-3 text-center font-bold text-slate-300 bg-aura-bg/30 border-r border-aura-border align-middle text-xs"
                              >
                                {group.accountName}
                              </td>
                            ) : null}

                            <td className="py-2.5 px-4 font-semibold text-slate-100">
                              {item.stockName}
                            </td>

                            <td
                              onClick={() =>
                                handleStartInlineEdit(item.id, "quantity", item.quantity)
                              }
                              className="py-2.5 px-3 text-right font-mono cursor-pointer hover:bg-amber-500/10 transition"
                            >
                              {inlineEditing &&
                              inlineEditing.itemId === item.id &&
                              inlineEditing.field === "quantity" ? (
                                <input
                                  autoFocus
                                  type="number"
                                  value={inlineEditing.value}
                                  onChange={(e) =>
                                    setInlineEditing({ ...inlineEditing, value: e.target.value })
                                  }
                                  onBlur={handleSaveInlineEdit}
                                  onKeyDown={handleInlineKeyDown}
                                  className="w-20 px-1 py-0.5 bg-aura-bg border border-amber-400 rounded text-right font-mono text-xs text-white focus:outline-none"
                                />
                              ) : (
                                <span className="text-slate-200">{formatKRW(item.quantity)}</span>
                              )}
                            </td>

                            <td
                              onClick={() =>
                                handleStartInlineEdit(item.id, "avgBuyPrice", item.avgBuyPrice)
                              }
                              className="py-2.5 px-3 text-right font-mono cursor-pointer hover:bg-amber-500/10 transition"
                            >
                              {inlineEditing &&
                              inlineEditing.itemId === item.id &&
                              inlineEditing.field === "avgBuyPrice" ? (
                                <input
                                  autoFocus
                                  type="number"
                                  value={inlineEditing.value}
                                  onChange={(e) =>
                                    setInlineEditing({ ...inlineEditing, value: e.target.value })
                                  }
                                  onBlur={handleSaveInlineEdit}
                                  onKeyDown={handleInlineKeyDown}
                                  className="w-24 px-1 py-0.5 bg-aura-bg border border-amber-400 rounded text-right font-mono text-xs text-white focus:outline-none"
                                />
                              ) : (
                                <span className="text-slate-300">{formatKRW(item.avgBuyPrice)}</span>
                              )}
                            </td>

                            <td
                              onClick={() =>
                                handleStartInlineEdit(item.id, "currentPrice", item.currentPrice)
                              }
                              className="py-2.5 px-3 text-right font-mono cursor-pointer hover:bg-amber-500/10 transition"
                            >
                              {inlineEditing &&
                              inlineEditing.itemId === item.id &&
                              inlineEditing.field === "currentPrice" ? (
                                <input
                                  autoFocus
                                  type="number"
                                  value={inlineEditing.value}
                                  onChange={(e) =>
                                    setInlineEditing({ ...inlineEditing, value: e.target.value })
                                  }
                                  onBlur={handleSaveInlineEdit}
                                  onKeyDown={handleInlineKeyDown}
                                  className="w-24 px-1 py-0.5 bg-aura-bg border border-amber-400 rounded text-right font-mono text-xs text-white focus:outline-none"
                                />
                              ) : (
                                <span className="text-amber-300 font-bold">
                                  {formatKRW(item.currentPrice)}
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                              {formatKRW(item.buyAmount)}
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono text-slate-100 font-semibold">
                              {formatKRW(item.evaluatedAmount)}
                            </td>

                            <td
                              onClick={() =>
                                handleStartInlineEdit(
                                  item.id,
                                  "dividendOrProfit",
                                  item.dividendOrProfit
                                )
                              }
                              className="py-2.5 px-3 text-right font-mono cursor-pointer hover:bg-amber-500/10 transition"
                            >
                              {inlineEditing &&
                              inlineEditing.itemId === item.id &&
                              inlineEditing.field === "dividendOrProfit" ? (
                                <input
                                  autoFocus
                                  type="number"
                                  value={inlineEditing.value}
                                  onChange={(e) =>
                                    setInlineEditing({ ...inlineEditing, value: e.target.value })
                                  }
                                  onBlur={handleSaveInlineEdit}
                                  onKeyDown={handleInlineKeyDown}
                                  className="w-24 px-1 py-0.5 bg-aura-bg border border-amber-400 rounded text-right font-mono text-xs text-white focus:outline-none"
                                />
                              ) : (
                                <span className="text-emerald-400 font-semibold">
                                  {formatKRW(item.dividendOrProfit)}
                                </span>
                              )}
                            </td>

                            <td
                              className={`py-2.5 px-3 text-right font-mono font-bold ${
                                isUp ? "text-rose-500" : "text-sky-400"
                              }`}
                            >
                              {formatKRW(item.evaluatedProfit)}
                            </td>

                            <td
                              className={`py-2.5 px-3 text-right font-mono font-bold ${
                                isUp ? "text-rose-500" : "text-sky-400"
                              }`}
                            >
                              {formatPercent(item.profitRate)}
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  onClick={() => handleOpenEdit(item)}
                                  title="상세 모달 수정"
                                  className="p-1 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded transition"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteStock(item.id, item.stockName)}
                                  title="삭제"
                                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              )}

              {/* 4. 매도손익 Row */}
              <tr className="bg-amber-500/15 border-t-2 border-b-2 border-amber-500/40 font-bold h-12">
                <td colSpan={2} className="py-3 px-4 text-amber-300 font-extrabold text-xs">
                  ★ 월말 매도손익
                </td>
                <td colSpan={5} className="py-3 px-3 text-xs text-aura-muted">
                  {isEditingRealizedGain ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-300">금액 입력:</span>
                      <input
                        type="number"
                        value={realizedGainInput}
                        onChange={(e) => setRealizedGainInput(e.target.value)}
                        className="w-32 px-2 py-1 bg-aura-bg border border-amber-400 rounded text-right text-xs font-mono text-white focus:outline-none"
                      />
                      <button
                        onClick={handleSaveRealizedGain}
                        className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded"
                        title="저장"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingRealizedGain(false);
                          setRealizedGainInput(currentRecord.realizedGain.toString());
                        }}
                        className="p-1 text-slate-400 hover:bg-slate-700 rounded"
                        title="취소"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span>(월중 주식 매도로 실현된 확정 손익을 기록합니다)</span>
                  )}
                </td>
                <td className="py-3 px-3 text-right">
                  {!isEditingRealizedGain && (
                    <button
                      onClick={() => setIsEditingRealizedGain(true)}
                      className="text-[11px] text-amber-400 hover:underline flex items-center justify-end space-x-1 float-right"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>수정</span>
                    </button>
                  )}
                </td>
                <td
                  className={`py-3 px-3 text-right font-mono font-extrabold ${
                    currentRecord.realizedGain >= 0 ? "text-amber-400" : "text-sky-400"
                  }`}
                >
                  {formatKRW(currentRecord.realizedGain)}
                </td>
                <td colSpan={3} className="py-3 px-3 text-right text-[11px] text-aura-muted">
                  총 배당/수익 및 전체 손익에 자동 합산됨
                </td>
              </tr>

              {/* 5. 최종 합산 Row */}
              <tr className="bg-aura-bg font-extrabold text-sm border-t-2 border-aura-border h-12">
                <td colSpan={3} className="py-4 px-4 text-center text-amber-300 text-sm tracking-widest">
                  합 산
                </td>
                <td colSpan={3} className="py-4 px-3 text-right text-xs text-aura-muted">
                  -
                </td>
                <td className="py-4 px-3 text-right font-mono text-slate-100">
                  {formatKRW(currentRecord.totalBuyAmount)}
                </td>
                <td className="py-4 px-3 text-right font-mono text-slate-100">
                  {formatKRW(currentRecord.totalEvaluatedAmount)}
                </td>
                <td className="py-4 px-3 text-right font-mono text-emerald-400">
                  {formatKRW(currentRecord.totalDividendOrProfit)}
                </td>
                <td
                  className={`py-4 px-3 text-right font-mono ${
                    currentRecord.totalProfit >= 0 ? "text-rose-500" : "text-sky-400"
                  }`}
                >
                  {formatKRW(currentRecord.totalProfit)}
                </td>
                <td
                  className={`py-4 px-3 text-right font-mono ${
                    currentRecord.totalProfitRate >= 0 ? "text-rose-500" : "text-sky-400"
                  }`}
                >
                  {formatPercent(currentRecord.totalProfitRate)}
                </td>
                <td className="py-4 px-3 text-center text-xs text-aura-muted">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. 새 계좌 추가 모달 */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-aura-card border border-aura-border rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-100 mb-3 flex items-center space-x-2">
              <FolderPlus className="w-5 h-5 text-amber-400" />
              <span>새로운 금융 계좌 추가</span>
            </h3>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  계좌 이름 입력
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newAccountInput}
                  onChange={(e) => setNewAccountInput(e.target.value)}
                  placeholder="예: 연금저축(KB), 일반(키움) 등"
                  className="w-full px-3 py-2 bg-aura-bg border border-aura-border rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddAccountModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-yellow-500 rounded-xl"
                >
                  계좌 생성하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. 종목 추가 / 수정 모달 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-aura-card border border-aura-border rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-aura-border">
              <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <span>{editingItem ? "종목 자산 수정" : "새 종목 추가"}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStock} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    계좌 선택
                  </label>
                  <select
                    value={formAccountName}
                    onChange={(e) => setFormAccountName(e.target.value)}
                    className="w-full px-3 py-2 bg-aura-bg border border-aura-border rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    {accountList.map((acc) => (
                      <option key={acc} value={acc}>
                        {acc}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    종목명
                  </label>
                  <input
                    type="text"
                    required
                    value={formStockName}
                    onChange={(e) => setFormStockName(e.target.value)}
                    placeholder="예: ACE 미국S&P500"
                    className="w-full px-3 py-2 bg-aura-bg border border-aura-border rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    보유 수량
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    placeholder="예: 100"
                    className="w-full px-3 py-2 bg-aura-bg border border-aura-border rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    매입단가 (평균단가)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formAvgBuyPrice}
                    onChange={(e) => setFormAvgBuyPrice(e.target.value)}
                    placeholder="예: 25000"
                    className="w-full px-3 py-2 bg-aura-bg border border-aura-border rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    현재가 (현재단가)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formCurrentPrice}
                    onChange={(e) => setFormCurrentPrice(e.target.value)}
                    placeholder="예: 26000"
                    className="w-full px-3 py-2 bg-aura-bg border border-aura-border rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    배당금 / 수익
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formDividend}
                    onChange={(e) => setFormDividend(e.target.value)}
                    placeholder="예: 15000"
                    className="w-full px-3 py-2 bg-aura-bg border border-aura-border rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-aura-border flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:bg-aura-border transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 shadow-md transition"
                >
                  {editingItem ? "수정 내용 적용" : "종목 추가하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. 새 월 생성 모달 */}
      {isNewMonthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-aura-card border border-aura-border rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-aura-border">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Copy className="w-5 h-5 text-amber-400" />
                <span>새로운 월 생성 (지난달 복사)</span>
              </h3>
              <button
                onClick={() => setIsNewMonthModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewMonth} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  생성할 새로운 연월 (YYYY.MM)
                </label>
                <input
                  type="text"
                  required
                  value={newYearMonthInput}
                  onChange={(e) => setNewYearMonthInput(e.target.value)}
                  placeholder="예: 2026.11"
                  className="w-full px-3 py-2 bg-aura-bg border border-aura-border rounded-xl text-sm font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  복사해올 기준 연월
                </label>
                <select
                  value={copyFromMonth}
                  onChange={(e) => setCopyFromMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-aura-bg border border-aura-border rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {records.map((r) => (
                    <option key={r.yearMonth} value={r.yearMonth}>
                      {r.yearMonth} 포트폴리오 가져오기
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-aura-muted mt-1.5">
                  기준 연월의 모든 계좌와 종목, 수량, 매입단가가 새 연월로 그대로 복제됩니다.
                </p>
              </div>

              <div className="pt-3 border-t border-aura-border flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewMonthModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:bg-aura-border transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 shadow-md transition"
                >
                  복사 및 생성하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
