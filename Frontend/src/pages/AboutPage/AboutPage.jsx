import React, { useEffect } from 'react';
import styled from 'styled-components';
import { usePublicSettings } from '../../hooks/useSettings';

const PageWrapper = styled.div`
    background: #f8fafc;
    padding: 40px 0 64px;
`;

const Container = styled.div`
    max-width: 1120px;
    margin: 0 auto;
    padding: 0 20px;
`;

const Hero = styled.div`
    background: linear-gradient(135deg, #0f172a 0%, #1f2937 100%);
    border-radius: 14px;
    padding: 40px;
    color: #fff;
    box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
    margin-bottom: 32px;
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 0.6s ease, transform 0.6s ease;

    &.reveal {
        opacity: 1;
        transform: translateY(0);
    }

    @media (max-width: 768px) {
        padding: 28px 24px;
    }
`;

const HeroTitle = styled.h1`
    margin: 0 0 12px;
    font-size: 36px;
    font-weight: 800;
    letter-spacing: -0.5px;

    @media (max-width: 768px) {
        font-size: 28px;
    }
`;

const HeroText = styled.p`
    margin: 0;
    font-size: 16px;
    line-height: 1.7;
    color: #e2e8f0;
`;

const SectionGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
    }
`;

const SectionCard = styled.div`
    background: #ffffff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
    border: 1px solid rgba(148, 163, 184, 0.2);
    transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.6s ease;
    opacity: 0;
    transform: translateY(16px);

    &.reveal {
        opacity: 1;
        transform: translateY(0);
    }

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 18px 36px rgba(15, 23, 42, 0.12);
    }
`;

const SectionTitle = styled.h2`
    margin: 0 0 12px;
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
`;

const SectionText = styled.p`
    margin: 0;
    font-size: 14px;
    line-height: 1.8;
    color: #475569;
`;

const ValuesList = styled.ul`
    margin: 0;
    padding: 0 0 0 18px;
    color: #475569;
    line-height: 1.8;
    font-size: 14px;
`;

const StoryBlock = styled.div`
    margin-top: 24px;
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 24px;

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
    }
`;

const StoryImage = styled.div`
    border-radius: 12px;
    background: ${props => props.$image ? `url(${props.$image}) center/cover no-repeat` : 'linear-gradient(135deg, #cbd5f5 0%, #fef3c7 100%)'};
    min-height: 240px;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1f2937;
    font-weight: 700;
    letter-spacing: 0.3px;
    box-shadow: 0 12px 26px rgba(15, 23, 42, 0.1);
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 0.6s ease, transform 0.6s ease;

    &.reveal {
        opacity: 1;
        transform: translateY(0);
    }

    &::after {
        content: '';
        display: ${props => (props.$image ? 'block' : 'none')};
        position: absolute;
        inset: 0;
        border-radius: 12px;
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.2), rgba(15, 23, 42, 0.05));
    }
`;

const AboutPage = () => {
    const { settings } = usePublicSettings();

    useEffect(() => {
        const elements = document.querySelectorAll('[data-reveal]');
        if (!elements.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('reveal');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.2 }
        );

        elements.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const defaults = {
        brandTitle: 'Gi?i thi?u th??ng hi?u',
        brandContent:
            'WALKZY l? h?nh tr?nh k?t h?p gi?a thi?t k? tinh g?n, ch?t l??ng b?n b? v? c?m h?ng chuy?n ??ng m?i ng?y. Ch?ng t?i tin r?ng m?t ??i gi?y t?t s? n?ng t?m tr?i nghi?m s?ng.',
        visionTitle: 'T?m nh?n ? s? m?nh',
        visionContent:
            'Tr? th?nh th??ng hi?u gi?y Vi?t ???c y?u th?ch nh? thi?t k? hi?n ??i, ch?t li?u ch?n chu v? tr?i nghi?m mua s?m m??t m?. S? m?nh c?a WALKZY l? t?o ra nh?ng s?n ph?m ??ng tin c?y cho m?i h?nh tr?nh, t? c?ng vi?c ??n kh?m ph?.',
        valuesTitle: 'Gi? tr? c?t l?i',
        valuesContent: [
            'Ch?t l??ng b?n v?ng t? v?t li?u ??n quy tr?nh.',
            'Thi?t k? t?i gi?n, d? ph?i v? ph? h?p nhi?u phong c?ch.',
            'Tr?i nghi?m kh?ch h?ng ??t l?n h?ng ??u.',
            '??i m?i li?n t?c nh?ng kh?ng ??nh ??i s? tinh t?.'
        ],
        commitmentTitle: 'Cam k?t s?n ph?m',
        commitmentContent:
            'M?i s?n ph?m ??u ???c ki?m ??nh k? v? form d?ng, ?? b?n v? c?m gi?c mang. WALKZY cam k?t minh b?ch v? ch?t li?u, b?o h?nh r? r?ng v? h? tr? nhanh ch?ng khi c?n.',
        storyTitle: 'H?nh ?nh / Story',
        storyContent:
            'T? m?t x??ng nh? ??n h? th?ng c?a h?ng, ch?ng t?i lu?n theo ?u?i tr?i nghi?m ???p ? b?n ? v?a?. C?u chuy?n WALKZY l? c?u chuy?n c?a nh?ng b??c ch?n t? tin.',
        journeyTitle: 'H?nh tr?nh th??ng hi?u',
        journeyContent:
            'WALKZY b?t ??u v?i m?c ti?u t?o ra s?n ph?m d? mang, ph? h?p kh? h?u Vi?t Nam v? ?? ch?t l??ng ?? ??ng h?nh l?u d?i. H?m nay, ch?ng t?i ti?p t?c m? r?ng b? s?u t?p v? l?ng nghe kh?ch h?ng m?i ng?y.',
        storyImageLabel: 'H?nh ?nh / Story'
    };

    const valuesContentRaw = settings?.aboutValuesContent || '';
    const valuesFromSettings = valuesContentRaw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    const valuesList = valuesFromSettings.length ? valuesFromSettings : defaults.valuesContent;

    return (
        <PageWrapper>
            <Container>
                <Hero data-reveal>
                    <HeroTitle>{settings?.aboutBrandTitle || defaults.brandTitle}</HeroTitle>
                    <HeroText>{settings?.aboutBrandContent || defaults.brandContent}</HeroText>
                </Hero>

                <SectionGrid>
                    <SectionCard data-reveal>
                        <SectionTitle>{settings?.aboutVisionTitle || defaults.visionTitle}</SectionTitle>
                        <SectionText>{settings?.aboutVisionContent || defaults.visionContent}</SectionText>
                    </SectionCard>
                    <SectionCard data-reveal>
                        <SectionTitle>{settings?.aboutValuesTitle || defaults.valuesTitle}</SectionTitle>
                        <ValuesList>
                            {valuesList.map((value) => (
                                <li key={value}>{value}</li>
                            ))}
                        </ValuesList>
                    </SectionCard>
                    <SectionCard data-reveal>
                        <SectionTitle>{settings?.aboutCommitmentTitle || defaults.commitmentTitle}</SectionTitle>
                        <SectionText>{settings?.aboutCommitmentContent || defaults.commitmentContent}</SectionText>
                    </SectionCard>
                    <SectionCard data-reveal>
                        <SectionTitle>{settings?.aboutStoryTitle || defaults.storyTitle}</SectionTitle>
                        <SectionText>{settings?.aboutStoryContent || defaults.storyContent}</SectionText>
                    </SectionCard>
                </SectionGrid>

                <StoryBlock>
                    <SectionCard data-reveal>
                        <SectionTitle>{settings?.aboutJourneyTitle || defaults.journeyTitle}</SectionTitle>
                        <SectionText>{settings?.aboutJourneyContent || defaults.journeyContent}</SectionText>
                    </SectionCard>
                    <StoryImage data-reveal $image={settings?.aboutStoryImageUrl}>
                        {settings?.aboutStoryImageUrl ? '' : (settings?.aboutStoryImageLabel || defaults.storyImageLabel)}
                    </StoryImage>
                </StoryBlock>
            </Container>
        </PageWrapper>
    );
};

export default AboutPage;
