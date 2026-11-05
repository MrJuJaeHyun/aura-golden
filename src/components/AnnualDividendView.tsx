"use client";

/**
 * Aura Golden 연간 배당금 관리 컴포넌트 (AnnualDividendView.tsx)
 * 
 * [피드백 및 제로 데이터 정책 반영]
 * 1. 뚜렷한 하얀색(White) 막대그래프로 월별 배당금 수령추이 완벽 렌더링
 * 2. [+ 새 연도 추가] 모달을 통해 2028년 이후 자유로운 연도 등록 및 관리
 * 3. 마지막 '삭제' 컬럼 잘림 현상 박멸 (충분한 폭 및 가운데 정렬)
 * 4. 빈 상태(Empty State) 지원: 등록된 배당 종목이 없을 때도 에러 없이 깔끔한 안내 제공
 * 5. 모든 표 상단 컬럼명 가운데 정렬(text-center) 통일
 */

import React, { useState } from "react";
import {
  Coins,
  PlusCircle,
  Trash2,
  Calendar,
  TrendingUp,
  DollarSign,
  Check,
  CalendarPlus,
  X,
} from "lucide-react";
import { AnnualDividendItem } from "@/types";
import { formatKRW, calculateAnnualDividendSummary } from "@/lib/calculations";
import {
  getAnnualDividends,
  updateDividendMonth,
  addDividendStock,
  deleteDividendStock,
  getDividendYears,
  addDividendYear,
} from "@/lib/dataStore";

export const AnnualDividendView: React.FC = () => {
  // 사용 가능한 연도 목록
  const [availableYears, setAvailableYears] = useState<number[]>(() => getDividendYears());
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const years = getDividendYears();
    return years.length > 0 ? years[years.length - 1] : new Date().getFullYear();
  });
  const [dividendItems, setDividendItems] = useState<AnnualDividendItem[]>(() =>
    getAnnualDividends(selectedYear)
  );

  // 새 연도 추가 모달 상태
  const [isAddingYearModalOpen, setIsAddingYearModalOpen] = useState(false);
  const [newYearInput, setNewYearInput] = useState("");

  // 셀 인라인 편집 상태
  const [editingCell, setEditingCell] = useState<{
    stockName: string;
    monthIdx: number;
    value: string;
  } | null>(null);

  // 신규 배당 종목 추가 상태
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [newStockName, setNewStockName] = useState("");

  // 요약 통계 계산
  const summary = React.useMemo(() => {
    return calculateAnnualDividendSummary(selectedYear, dividendItems);
  }, [selectedYear, dividendItems]);

  // 연도 변경
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setDividendItems(getAnnualDividends(year));
  };

  // 새 연도 추가
  const handleCreateYear = (e: React.FormEvent) => {
    e.preventDefault();
    const yr = parseInt(newYearInput);
    if (isNaN(yr) || yr < 2000 || yr > 2100) {
      alert("올바른 4자리 연도를 입력해주세요 (예: 2028).");
      return;
    }
    const updated = addDividendYear(yr);
    setAvailableYears(updated);
    setSelectedYear(yr);
    setDividendItems(getAnnualDividends(yr));
    setNewYearInput("");
    setIsAddingYearModalOpen(false);
  };

  // 셀 편집 시작
  const handleStartEdit = (stockName: string, monthIdx: number, currentVal: number) => {
    setEditingCell({
      stockName,
      monthIdx,
      value: currentVal > 0 ? currentVal.toString() : "",
    });
  };

  // 셀 편집 저장
  const handleSaveCell = () => {
    if (!editingCell) return;
    const amount = parseFloat(editingCell.value) || 0;
    const updated = updateDividendMonth(
      selectedYear,
      editingCell.stockName,
      editingCell.monthIdx,
      amount
    );
    setDividendItems(updated);
    setEditingCell(null);
  };

  // 엔터키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveCell();
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  // 종목 추가
  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStockName.trim()) return;
    const updated = addDividendStock(selectedYear, newStockName.trim());
    setDividendItems(updated);
    setNewStockName("");
    setIsAddingStock(false);
  };

  // 종목 삭제
  const handleDeleteStock = (stockName: string) => {
    if (confirm(`'${stockName}' 배당 종목을 목록에서 삭제하시겠습니까?`)) {
      const updated = deleteDividendStock(selectedYear, stockName);
      setDividendItems(updated);
    }
  };

  // 월별 배당금 중 최대값
  const maxMonthlyTotal = Math.max(...summary.monthlyTotals, 1);

  return (
    <div className="space-y-6">
      
      {/* 1. 상단 컨트롤 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-aura-card border border-aura-border rounded-2xl shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-aura-muted uppercase tracking-wider block">
              배당 기준 연도
            </label>
            <div className="flex items-center space-x-2 mt-0.5">
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                className="bg-aura-bg border border-aura-border text-amber-300 font-bold text-lg rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr} className="bg-aura-card text-white">
                    {yr}년 배당 현황
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={() => setIsAddingYearModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-aura-bg hover:bg-aura-cardHover text-slate-200 border border-aura-border hover:border-amber-500/40 transition"
          >
            <CalendarPlus className="w-4 h-4 text-amber-400" />
            <span>새 연도 추가</span>
          </button>

          <button
            onClick={() => setIsAddingStock(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-black shadow-md shadow-amber-500/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>배당 종목 추가</span>
          </button>
        </div>
      </div>

      {/* 2. 연간 배당 지표 카드 & 선명한 하얀색 막대그래프 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* 연간 누적 총 배당금 카드 */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-yellow-600/10 to-aura-card border-2 border-amber-500/40 shadow-xl shadow-amber-500/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-amber-300">
              <span className="text-xs font-bold tracking-tight">연간 누적 총 배당금</span>
              <DollarSign className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-3xl font-black text-white mt-3 gold-text-gradient">
              ₩ {formatKRW(summary.grandTotal)}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-between text-xs text-aura-muted">
            <span>등록 종목: {summary.items.length}개</span>
            <span className="text-amber-300 font-semibold">
              월평균: ₩ {formatKRW(summary.grandTotal / 12)}
            </span>
          </div>
        </div>

        {/* 월별 배당금 추이: 선명한 하얀색(White) 막대그래프 */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-aura-card border border-aura-border shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>{selectedYear}년 월별 배당금 수령 추이 (하얀색 막대 차트)</span>
            </span>
            <span className="text-[11px] text-aura-muted">단위: 원</span>
          </div>

          <div className="grid grid-cols-12 gap-2 items-end h-28 pt-4 pb-1 border-b border-aura-border/60">
            {summary.monthlyTotals.map((tot, idx) => {
              const barHeightPx = tot > 0 ? Math.max(Math.round((tot / maxMonthlyTotal) * 75), 8) : 4;

              return (
                <div key={idx} className="flex flex-col items-center justify-end h-full group relative">
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-aura-bg border border-amber-400 text-[10px] text-amber-300 px-2 py-0.5 rounded-md shadow-xl pointer-events-none whitespace-nowrap z-20 font-mono font-bold">
                    {formatKRW(tot)}원
                  </div>

                  <div
                    style={{ height: `${barHeightPx}px` }}
                    className={`w-full max-w-[28px] rounded-t-md transition-all duration-300 shadow-md ${
                      tot > 0
                        ? "bg-white hover:bg-amber-300 shadow-white/30"
                        : "bg-slate-700/60"
                    }`}
                  />
                  
                  <span className="text-[10px] text-slate-300 mt-1 font-mono font-semibold">
                    {idx + 1}월
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 3. 연간 종목별 배당금 매트릭스 테이블 */}
      <div className="bg-aura-card border border-aura-border rounded-2xl shadow-xl overflow-hidden">
        
        <div className="px-6 py-4 border-b border-aura-border flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100">
              {selectedYear}년 종목별 월별 배당금 입금 내역 매트릭스
            </h3>
          </div>
          <p className="text-xs text-aura-muted">
            * 각 월의 셀을 클릭하면 즉시 금액을 입력/수정할 수 있습니다 (Enter: 저장, Esc: 취소).
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1150px]">
            <thead>
              <tr className="bg-amber-400 text-black font-extrabold text-[12px] border-b border-amber-500">
                <th className="py-3 px-3 text-center w-20">년도</th>
                <th className="py-3 px-4 text-center min-w-[200px]">종 목</th>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <th key={m} className="py-3 px-2 text-center min-w-[68px]">
                    {m}월
                  </th>
                ))}
                <th className="py-3 px-3 text-center min-w-[95px] bg-amber-500 text-black">
                  합 계
                </th>
                <th className="py-3 px-3 text-center min-w-[70px]">
                  삭제
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aura-border font-medium text-slate-200">
              {summary.items.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-aura-muted">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Coins className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-200">
                        {selectedYear}년에 등록된 배당 관리 종목이 없습니다.
                      </p>
                      <p className="text-xs text-aura-muted">
                        우측 상단의 <strong className="text-amber-400">[+ 배당 종목 추가]</strong> 버튼을 눌러 관리할 첫 배당주를 등록해 보세요!
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                summary.items.map((item, idx) => {
                  return (
                    <tr key={item.id} className="hover:bg-aura-cardHover/60 transition duration-150 h-10 border-b border-aura-border">
                      
                      {idx === 0 ? (
                        <td
                          rowSpan={summary.items.length + 1}
                          className="py-3 px-3 text-center font-bold text-amber-300 bg-aura-bg/80 border-r border-aura-border align-middle text-sm"
                        >
                          {selectedYear}년
                        </td>
                      ) : null}

                      <td className="py-2.5 px-4 font-semibold text-slate-100">
                        {item.stockName}
                      </td>

                      {item.months.map((val, mIdx) => {
                        const isEditing =
                          editingCell &&
                          editingCell.stockName === item.stockName &&
                          editingCell.monthIdx === mIdx;

                        return (
                          <td
                            key={mIdx}
                            onClick={() => !isEditing && handleStartEdit(item.stockName, mIdx, val)}
                            className={`py-2 px-2 text-right font-mono text-xs cursor-pointer transition ${
                              isEditing
                                ? "bg-amber-500/20"
                                : val > 0
                                ? "text-emerald-400 font-semibold hover:bg-amber-500/10"
                                : "text-slate-500 hover:bg-aura-border/40"
                            }`}
                          >
                            {isEditing ? (
                              <div className="flex items-center justify-end space-x-1">
                                <input
                                  autoFocus
                                  type="number"
                                  value={editingCell.value}
                                  onChange={(e) =>
                                    setEditingCell({ ...editingCell, value: e.target.value })
                                  }
                                  onBlur={handleSaveCell}
                                  onKeyDown={handleKeyDown}
                                  className="w-16 px-1 py-0.5 bg-aura-bg border border-amber-400 rounded text-right font-mono text-xs text-white focus:outline-none"
                                />
                                <button
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSaveCell();
                                  }}
                                  className="text-emerald-400"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span>{val > 0 ? formatKRW(val) : "0"}</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-300 bg-aura-bg/40">
                        {formatKRW(item.annualTotal)}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleDeleteStock(item.stockName)}
                          title="종목 삭제"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition inline-flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}

              {/* 하단 합산 Row */}
              <tr className="bg-amber-500/15 font-extrabold text-xs border-t-2 border-amber-500/40 h-11">
                <td className="py-3 px-4 text-center text-amber-300 font-extrabold tracking-wider">
                  합 산
                </td>
                {summary.monthlyTotals.map((tot, idx) => (
                  <td
                    key={idx}
                    className="py-3 px-2 text-right font-mono text-emerald-400 font-extrabold"
                  >
                    {formatKRW(tot)}
                  </td>
                ))}
                <td className="py-3 px-3 text-right font-mono text-sm text-amber-300 font-black bg-amber-500/20">
                  {formatKRW(summary.grandTotal)}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. 새 연도 추가 모달 */}
      {isAddingYearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-aura-card border border-aura-border rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-aura-border mb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <CalendarPlus className="w-5 h-5 text-amber-400" />
                <span>새로운 배당 연도 추가</span>
              </h3>
              <button
                onClick={() => setIsAddingYearModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateYear} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  추가할 연도 입력 (4자리)
                </label>
                <input
                  type="number"
                  required
                  autoFocus
                  value={newYearInput}
                  onChange={(e) => setNewYearInput(e.target.value)}
                  placeholder="예: 2028"
                  className="w-full px-3 py-2 bg-aura-bg border border-aura-border rounded-xl text-sm font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingYearModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-yellow-500 rounded-xl"
                >
                  연도 등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. 새 배당 종목 추가 모달 */}
      {isAddingStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-aura-card border border-aura-border rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-100 mb-3 flex items-center space-x-2">
              <PlusCircle className="w-5 h-5 text-amber-400" />
              <span>새 배당 관리 종목 추가</span>
            </h3>
            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  종목명 입력
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newStockName}
                  onChange={(e) => setNewStockName(e.target.value)}
                  placeholder="예: SCHD, 맥쿼리인프라 등"
                  className="w-full px-3 py-2 bg-aura-bg border border-aura-border rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingStock(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-yellow-500 rounded-xl"
                >
                  추가하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
