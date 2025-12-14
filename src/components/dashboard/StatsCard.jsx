import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function StatsCard({ title, value, icon: Icon, gradient, trend }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="glass-effect border-gray-700 overflow-hidden">
        <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 bg-gradient-to-r ${gradient} rounded-full opacity-10`} />
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
              <p className="text-3xl font-bold text-white">{value}</p>
            </div>
            <div className={`p-3 rounded-xl bg-gradient-to-r ${gradient} bg-opacity-20`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
          {trend && (
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="w-4 h-4 mr-1 text-green-400" />
              <span className="text-green-400 font-medium">{trend}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}