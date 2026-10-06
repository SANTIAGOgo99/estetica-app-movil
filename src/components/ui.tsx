import { useState, type PropsWithChildren, type ComponentProps } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { colors, fonts } from "../theme";
import { screens, useFlow, type Screen } from "../features/interfaces/Flow";
export type IconName = ComponentProps<typeof Feather>["name"];
export const money = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
export function Icon({
  name,
  size = 20,
  color = colors.ink,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return (
    <Feather
      name={name}
      size={size}
      color={color}
      accessible={false}
      aria-hidden={true}
    />
  );
}
export function Brand({ large = false }: { large?: boolean }) {
  return (
    <View style={{ alignItems: "center", gap: 8 }}>
      <Image
        source={
          large
            ? require("../../assets/brand/logo-nombre.png")
            : require("../../assets/brand/emblema.png")
        }
        accessibilityLabel="Ezequiel Castillo Hair Designer, logo original"
        resizeMode="contain"
        style={large ? { width: 210, height: 180 } : { width: 55, height: 58 }}
      />
      {!large && <Text style={s.brand}>EZEQUIEL CASTILLO</Text>}
    </View>
  );
}
export function Heading({ children }: { children: React.ReactNode }) {
  return (
    <Text accessibilityRole="header" style={s.heading}>
      {children}
    </Text>
  );
}
export function Body({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <Text style={[s.body, muted && { color: colors.muted }]}>{children}</Text>
  );
}
export function Card({ children }: PropsWithChildren) {
  return <View style={s.card}>{children}</View>;
}
export function Button({
  label,
  onPress,
  secondary = false,
  disabled = false,
  loading = false,
  icon,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.dark} />
      ) : (
        <>
          {icon && <Icon name={icon} size={18} />}
          <Text style={s.buttonText}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
export function TextAction({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={s.textAction}
    >
      <Text style={s.link}>{label}</Text>
    </Pressable>
  );
}
export function Field({
  label,
  icon,
  error,
  secret = false,
  ...props
}: TextInputProps & {
  label: string;
  icon?: IconName;
  error?: string;
  secret?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <View style={[s.inputWrap, error && { borderColor: colors.error }]}>
        {icon && <Icon name={icon} size={18} color={colors.muted} />}
        <TextInput
          {...props}
          accessibilityLabel={label}
          secureTextEntry={secret && !visible}
          placeholderTextColor={colors.muted}
          style={s.input}
        />
        {secret && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              visible ? "Ocultar contraseña" : "Mostrar contraseña"
            }
            accessibilityState={{ checked: visible }}
            disabled={props.editable === false}
            onPress={() => setVisible((value) => !value)}
            style={s.eye}
          >
            <Icon
              name={visible ? "eye-off" : "eye"}
              size={20}
              color={colors.muted}
            />
          </Pressable>
        )}
      </View>
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
    </View>
  );
}
export function Empty({
  title,
  description,
  icon = "inbox",
}: {
  title: string;
  description: string;
  icon?: IconName;
}) {
  return (
    <View style={s.empty}>
      <Icon name={icon} size={32} color={colors.roseDeep} />
      <Text style={s.subheading}>{title}</Text>
      <Body muted>{description}</Body>
    </View>
  );
}
export function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.body}>{label}</Text>
      <Text style={s.label}>{value}</Text>
    </View>
  );
}
export function Chips({
  values,
  value,
  onChange,
}: {
  values: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      style={{ flexGrow: 0, flexShrink: 0 }}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
    >
      {values.map((option) => (
        <Pressable
          key={option}
          accessibilityRole="button"
          accessibilityState={{ selected: value === option }}
          onPress={() => onChange(option)}
          style={[
            s.chip,
            value === option && {
              backgroundColor: colors.roseDeep,
              borderColor: colors.roseDeep,
            },
          ]}
        >
          <Text
            style={[s.chipText, value === option && { color: colors.surface }]}
          >
            {option}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
const tabs: { screen: Screen; label: string; icon: IconName }[] = [
  { screen: "home", label: "Inicio", icon: "home" },
  { screen: "services", label: "Servicios", icon: "scissors" },
  { screen: "products", label: "Productos", icon: "shopping-bag" },
  { screen: "appointments", label: "Citas", icon: "calendar" },
  { screen: "profile", label: "Perfil", icon: "user" },
];
export function Page({
  children,
  title,
  subtitle,
  screen,
  back,
  footer,
  scroll = true,
}: PropsWithChildren<{
  title?: string;
  subtitle?: string;
  screen?: Screen;
  back?: Screen;
  footer?: React.ReactNode;
  scroll?: boolean;
}>) {
  const flow = useFlow();
  return (
    <SafeAreaView style={s.page}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {flow.demo && (
          <View style={s.demoBar}>
            <Text style={s.demoText}>PROTOTIPO · DATOS DE EJEMPLO</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
            >
              {screens.map((item) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={"Ver " + item.title}
                  key={item.screen}
                  onPress={() => flow.go(item.screen)}
                  style={s.demoChip}
                >
                  <Text style={s.demoText}>{item.title}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.content}
          >
            {back && (
              <TextAction label="← Volver" onPress={() => flow.go(back)} />
            )}
            <View style={{ gap: 6 }}>
              {title && <Heading>{title}</Heading>}
              {subtitle && <Body muted>{subtitle}</Body>}
            </View>
            {children}
          </ScrollView>
        ) : (
          <View style={[s.content, { flex: 1 }]}>
            {back && (
              <TextAction label="← Volver" onPress={() => flow.go(back)} />
            )}
            <View style={{ gap: 6 }}>
              {title && <Heading>{title}</Heading>}
              {subtitle && <Body muted>{subtitle}</Body>}
            </View>
            {children}
          </View>
        )}
        {footer && <View style={s.footer}>{footer}</View>}
        {screen && (
          <View style={s.nav}>
            {tabs.map((tab) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: screen === tab.screen }}
                key={tab.screen}
                onPress={() => flow.go(tab.screen)}
                style={s.navItem}
              >
                <Icon
                  name={tab.icon}
                  size={20}
                  color={screen === tab.screen ? colors.roseDeep : colors.muted}
                />
                <Text
                  style={[
                    s.navLabel,
                    screen === tab.screen && { color: colors.roseDeep },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
    padding: 22,
    gap: 20,
    paddingBottom: 28,
  },
  heading: {
    fontFamily: fonts.title,
    fontSize: 34,
    lineHeight: 40,
    color: colors.dark,
  },
  subheading: {
    fontFamily: fonts.title,
    fontSize: 25,
    lineHeight: 30,
    color: colors.dark,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
  },
  label: {
    fontFamily: fonts.strong,
    fontSize: 14,
    lineHeight: 21,
    color: colors.ink,
  },
  brand: {
    fontFamily: fonts.medium,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.ink,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    minHeight: 52,
    borderRadius: 28,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 20,
  },
  secondary: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.roseDeep,
  },
  buttonText: { fontFamily: fonts.strong, fontSize: 15, color: colors.dark },
  textAction: { minHeight: 44, justifyContent: "center" },
  link: { fontFamily: fonts.medium, fontSize: 14, color: colors.roseDeep },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 14,
    minHeight: 54,
    gap: 10,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    paddingVertical: 12,
    paddingRight: 12,
  },
  eye: {
    minWidth: 48,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.error,
  },
  empty: {
    backgroundColor: colors.cream,
    borderRadius: 18,
    padding: 24,
    gap: 12,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    paddingHorizontal: 16,
    minHeight: 40,
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  chipText: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  nav: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 48,
  },
  navLabel: { fontFamily: fonts.medium, fontSize: 11, color: colors.muted },
  demoBar: {
    backgroundColor: colors.cream,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  demoText: { fontFamily: fonts.medium, fontSize: 11, color: colors.roseDeep },
  demoChip: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.roseDeep,
    justifyContent: "center",
  },
});
