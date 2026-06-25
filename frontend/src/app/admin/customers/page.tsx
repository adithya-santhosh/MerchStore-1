import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { getAdminCustomers, getCustomerStatsApi } from "@/lib/api";
import { Users, UserCheck, ShieldAlert, ShoppingBag, ChevronRight, User } from "lucide-react";
import CustomerFilters from "@/components/admin/CustomerFilters";
import CustomerPagination from "@/components/admin/CustomerPagination";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  // Parallel server-side fetch
  const [customersData, stats] = await Promise.all([
    getAdminCustomers({
      page: params.page || "1",
      search: params.search,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    }, token),
    getCustomerStatsApi(token),
  ]);

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Customer Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor customer activity, transaction volumes, and profiles.
        </p>
      </div>

      {/* ── Stats Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Customers",
            value: stats.totalCustomers,
            icon: Users,
            color: "text-foreground",
            bg: "bg-muted/20",
          },
          {
            label: "New This Month",
            value: stats.newThisMonth,
            icon: UserCheck,
            color: "text-emerald-500",
            bg: "bg-emerald-500/5",
          },
          {
            label: "Total Admins",
            value: stats.totalAdmins,
            icon: ShieldAlert,
            color: "text-amber-500",
            bg: "bg-amber-500/5",
          },
          {
            label: "With Purchases",
            value: stats.customersWithOrders,
            icon: ShoppingBag,
            color: "text-blue-500",
            bg: "bg-blue-500/5",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border border-border/70 p-4 ${stat.bg} space-y-1`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-semibold">
                {stat.label}
              </p>
              <stat.icon className={`size-4 ${stat.color} opacity-50`} />
            </div>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters (Client Component) ───────────────────────────────────── */}
      <Suspense fallback={null}>
        <CustomerFilters />
      </Suspense>

      {/* ── Customers List ───────────────────────────────────────────────── */}
      {customersData.customers.length > 0 ? (
        <div className="bg-card/40 border border-border/85 rounded-3xl overflow-hidden shadow-sm">
          <div className="divide-y divide-border/60">
            {customersData.customers.map((customer) => (
              <div
                key={customer.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-muted/10 transition-colors text-xs"
              >
                {/* Avatar (Mobile Layout uses flex/grid helpers) */}
                <div className="col-span-1 flex items-center gap-3 md:block">
                  <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm">
                    {getInitials(customer.name)}
                  </div>
                  <div className="md:hidden">
                    <div className="font-bold flex items-center gap-2">
                      {customer.name}
                      {customer.role === "ADMIN" && (
                        <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="text-muted-foreground text-[10px] mt-0.5">
                      {customer.email}
                    </div>
                  </div>
                </div>

                {/* Name / Role (Desktop Only) */}
                <div className="hidden md:col-span-2 md:flex flex-col gap-1">
                  <span className="font-bold text-foreground truncate">
                    {customer.name}
                  </span>
                  {customer.role === "ADMIN" && (
                    <span className="w-fit bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase">
                      Admin
                    </span>
                  )}
                </div>

                {/* Email (Desktop Only) */}
                <div className="hidden md:col-span-2 md:block text-muted-foreground truncate">
                  {customer.email}
                </div>

                {/* Phone */}
                <div className="col-span-1 text-muted-foreground md:text-foreground">
                  <span className="md:hidden font-semibold text-muted-foreground/60 mr-2">
                    Phone:
                  </span>
                  {customer.phone || "—"}
                </div>

                {/* Joined Date */}
                <div className="col-span-1 text-muted-foreground">
                  <span className="md:hidden font-semibold text-muted-foreground/60 mr-2">
                    Joined:
                  </span>
                  {formatDate(customer.createdAt)}
                </div>

                {/* Orders Count */}
                <div className="col-span-1 md:text-center text-muted-foreground md:text-foreground">
                  <span className="md:hidden font-semibold text-muted-foreground/60 mr-2">
                    Orders:
                  </span>
                  <span className="font-bold">{customer.totalOrders}</span>
                </div>

                {/* Total Spent */}
                <div className="col-span-2 text-muted-foreground md:text-foreground">
                  <span className="md:hidden font-semibold text-muted-foreground/60 mr-2">
                    Total Spent:
                  </span>
                  <span className="font-extrabold text-foreground">
                    ₹{customer.totalSpent.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* View Detail Action */}
                <div className="col-span-2 flex justify-end">
                  <Link
                    href={`/admin/customers/${customer.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer w-full md:w-auto justify-center"
                  >
                    <span>View Profile</span>
                    <ChevronRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 border border-border/80 rounded-3xl bg-card/20 max-w-md mx-auto space-y-4">
          <div className="size-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground/40 mx-auto">
            <User className="size-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              {params.search ? "No Customers Match" : "No Customers Yet"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
              {params.search
                ? "No customers match your search criteria. Try a different query."
                : "No registered customers found in the store database."}
            </p>
          </div>
        </div>
      )}

      {/* ── Pagination (Client Component) ────────────────────────────────── */}
      <Suspense fallback={null}>
        <CustomerPagination
          total={customersData.total}
          page={customersData.page}
          limit={customersData.limit}
          totalPages={customersData.totalPages}
        />
      </Suspense>
    </div>
  );
}
