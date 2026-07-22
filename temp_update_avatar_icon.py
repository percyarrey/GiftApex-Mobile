from pathlib import Path
path = Path(r"app/(support)/chat/[id].tsx")
text = path.read_text(encoding='utf-8')
old = '''                  {profileAvatar ? (
                    <Image
                      source={{ uri: profileAvatar }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {getInitials(profileName)}
                    </Text>
                  )}'''
new = '''                  {profileAvatar ? (
                    <Image
                      source={{ uri: profileAvatar }}
                      style={styles.avatarImage}
                    />
                  ) : isUnassigned ? (
                    <MaterialCommunityIcons
                      name="account-question"
                      size={18}
                      color={PRIMARY}
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {getInitials(profileName)}
                    </Text>
                  )}'''
if old not in text:
    raise SystemExit('Pattern not found')
path.write_text(text.replace(old, new), encoding='utf-8')
