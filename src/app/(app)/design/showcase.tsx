"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Tabs } from "@/components/ui/tabs";
import { fadeUp, stagger } from "@/lib/motion";

export function Showcase() {
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);
  const [tab, setTab] = useState("gym");
  const [chip, setChip] = useState("lose");
  const [open, setOpen] = useState(false);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-6">
      <motion.h1 variants={fadeUp} className="text-4xl font-extrabold lg:text-5xl">
        Витрина компонентов
      </motion.h1>

      <motion.section variants={fadeUp}>
        <Card className="flex flex-wrap gap-3">
          <Button>Начать</Button>
          <Button variant="secondary">Вторичная</Button>
          <Button variant="ghost">Прозрачная</Button>
          <Button size="sm">Маленькая</Button>
          <Button disabled>Недоступна</Button>
        </Card>
      </motion.section>

      <motion.section variants={fadeUp}>
        <Card className="flex flex-col gap-4">
          <Input label="Email" type="email" placeholder="you@example.com" />
          <Input label="Пароль" type="password" error="Минимум 8 символов" />
        </Card>
      </motion.section>

      <motion.section variants={fadeUp}>
        <Card className="flex flex-col gap-6">
          <Slider label="Рост" value={height} onChange={setHeight} min={100} max={250} unit="см" />
          <Slider
            label="Вес"
            value={weight}
            onChange={setWeight}
            min={30}
            max={300}
            step={0.5}
            unit="кг"
          />
        </Card>
      </motion.section>

      <motion.section variants={fadeUp}>
        <Card className="flex flex-col gap-4">
          <Tabs
            tabs={[
              { id: "gym", label: "Зал" },
              { id: "home", label: "Дом" },
            ]}
            value={tab}
            onChange={setTab}
          />
          <div className="flex flex-wrap gap-2">
            {[
              ["lose", "Сбросить вес"],
              ["gain", "Набрать вес"],
              ["muscle", "Накачать мышцы"],
            ].map(([id, label]) => (
              <Chip key={id} active={chip === id} onClick={() => setChip(id)}>
                {label}
              </Chip>
            ))}
          </div>
        </Card>
      </motion.section>

      <motion.section variants={fadeUp}>
        <Card className="flex flex-col gap-3">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-24 w-full" />
          <Button onClick={() => setOpen(true)} className="self-start">
            Открыть окно
          </Button>
        </Card>
      </motion.section>

      <Modal open={open} onClose={() => setOpen(false)} title="Поздравляем!">
        <p className="text-muted">Пример модального окна для достижений.</p>
      </Modal>
    </motion.div>
  );
}
